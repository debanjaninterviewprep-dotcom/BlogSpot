# Copy to neon-backup.config.ps1 and fill in real values. Never commit the copy.
$PRIMARY_CONN = 'postgresql://USER:PASSWORD@PRIMARY-HOST.neon.tech/neondb?sslmode=require'
$BACKUP_CONN  = 'postgresql://USER:PASSWORD@BACKUP-HOST.neon.tech/neondb?sslmode=require'
