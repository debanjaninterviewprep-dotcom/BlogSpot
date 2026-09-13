# =====================================================
# Neon Database Backup Sync
# Mirrors the PRIMARY neondb public schema into the BACKUP project.
# Run monthly. Existing backup objects are dropped and recreated.
#
# Credentials live in neon-backup.config.ps1 (gitignored).
# Copy neon-backup.config.example.ps1 to create it.
# =====================================================

$CONFIG = Join-Path $PSScriptRoot "neon-backup.config.ps1"
if (-not (Test-Path $CONFIG)) {
    Write-Error "Missing $CONFIG. Copy neon-backup.config.example.ps1 and fill in the connection strings."
    exit 1
}
. $CONFIG

if (-not $PRIMARY_CONN -or -not $BACKUP_CONN) {
    Write-Error "PRIMARY_CONN / BACKUP_CONN not set in $CONFIG."
    exit 1
}

# PostgreSQL client tools are not on PATH by default.
$PG_BIN = "C:\Program Files\PostgreSQL\18\bin"
if (Test-Path $PG_BIN) { $env:PATH = "$PG_BIN;$env:PATH" }

$BACKUP_DIR = "C:\BlogSpot-Backups"
$TIMESTAMP  = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$DUMP_FILE  = "$BACKUP_DIR\blogspot_$TIMESTAMP.dump"
$LOG_FILE   = "$BACKUP_DIR\sync_$TIMESTAMP.log"
$VERIFY_SQL = Join-Path $PSScriptRoot "Database\verify-sync.sql"

if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $line = "[{0}] [{1}] {2}" -f (Get-Date -Format "HH:mm:ss"), $Level, $Message
    Write-Host $line
    Add-Content -Path $LOG_FILE -Value $line
}

# Quoted identifiers survive PowerShell -> native exe only via a .sql file.
function Get-Counts {
    param([string]$Conn)
    $counts = @{}
    foreach ($line in (& psql $Conn -t -A -F '|' -f $VERIFY_SQL 2>&1)) {
        $parts = "$line".Split('|')
        if ($parts.Count -eq 2) { $counts[$parts[0].Trim()] = $parts[1].Trim() }
    }
    return $counts
}

Write-Log "===== NEON BACKUP SYNC STARTED ====="

# --- Step 1: dump primary (public schema, schema + data) ---
Write-Log "Step 1/4: Dumping PRIMARY public schema..."
& pg_dump $PRIMARY_CONN --schema=public --format=custom --large-objects --no-owner --no-privileges --file=$DUMP_FILE
if ($LASTEXITCODE -ne 0) {
    Write-Log "Dump failed (exit $LASTEXITCODE)." "ERROR"
    exit 1
}
Write-Log ("Dump created: {0} ({1:N2} MB)" -f $DUMP_FILE, ((Get-Item $DUMP_FILE).Length / 1MB))

# --- Step 2: reset backup public schema ---
# The dump recreates the schema itself, so only drop here.
Write-Log "Step 2/4: Dropping BACKUP public schema..."
& psql $BACKUP_CONN -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE;"
if ($LASTEXITCODE -ne 0) {
    Write-Log "Schema reset failed (exit $LASTEXITCODE)." "ERROR"
    exit 1
}

# --- Step 3: restore into backup ---
Write-Log "Step 3/4: Restoring into BACKUP..."
& pg_restore --dbname=$BACKUP_CONN --no-owner --no-privileges $DUMP_FILE
if ($LASTEXITCODE -ne 0) {
    Write-Log "Restore reported errors (exit $LASTEXITCODE). Verifying anyway..." "WARN"
}

# --- Step 4: verify ---
Write-Log "Step 4/4: Verifying..."

$primary = Get-Counts $PRIMARY_CONN
$backup  = Get-Counts $BACKUP_CONN
$mismatches = 0

foreach ($key in ($primary.Keys | Sort-Object)) {
    $p = $primary[$key]
    $b = $backup[$key]
    if ($p -eq $b) {
        Write-Log ("  OK       {0,-22} {1}" -f $key, $p)
    } else {
        $mismatches++
        Write-Log ("  MISMATCH {0,-22} primary={1} backup={2}" -f $key, $p, $b) "WARN"
    }
}

if ($primary.Count -eq 0 -or $backup.Count -eq 0) {
    Write-Log "===== VERIFICATION FAILED - no counts returned =====" "ERROR"
} elseif ($mismatches -eq 0) {
    Write-Log "===== SYNC VERIFIED OK ====="
} else {
    Write-Log "===== SYNC COMPLETED WITH $mismatches MISMATCH(ES) - review log =====" "WARN"
}

Write-Log "Dump: $DUMP_FILE"
Write-Log "Log:  $LOG_FILE"
