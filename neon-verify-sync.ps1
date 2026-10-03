# =====================================================
# Neon Database Verify Sync
# Read-only check: compares per-table row counts between PRIMARY and BACKUP.
# Does NOT modify either database. Use neon-backup-sync.ps1 to actually sync.
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

$VERIFY_SQL = Join-Path $PSScriptRoot "Database\verify-sync.sql"

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

Write-Host "===== NEON VERIFY SYNC STARTED ====="

Write-Host "Querying PRIMARY..."
$primary = Get-Counts $PRIMARY_CONN
Write-Host "Querying BACKUP..."
$backup  = Get-Counts $BACKUP_CONN

if ($primary.Count -eq 0 -or $backup.Count -eq 0) {
    Write-Host "===== VERIFICATION FAILED - no counts returned =====" -ForegroundColor Red
    exit 1
}

$allKeys = ($primary.Keys + $backup.Keys) | Sort-Object -Unique
$mismatches = 0

foreach ($key in $allKeys) {
    $p = $primary[$key]
    $b = $backup[$key]
    if ($p -eq $b) {
        Write-Host ("  OK       {0,-22} {1}" -f $key, $p)
    } else {
        $mismatches++
        Write-Host ("  MISMATCH {0,-22} primary={1} backup={2}" -f $key, $p, $b) -ForegroundColor Yellow
    }
}

if ($mismatches -eq 0) {
    Write-Host "===== VERIFIED OK - both databases match =====" -ForegroundColor Green
} else {
    Write-Host "===== $mismatches MISMATCH(ES) FOUND - run neon-backup-sync.ps1 to resync =====" -ForegroundColor Red
    exit 1
}
