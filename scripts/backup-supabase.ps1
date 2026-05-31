# =============================================================================
# backup-supabase.ps1 — Backup automatico do banco Supabase via pg_dump
# Projeto: sync-mood-saas | Supabase ref: tigubwxotanaznqqxogf
# =============================================================================
# USO: .\scripts\backup-supabase.ps1
# PREREQUISITO: pg_dump instalado e na PATH (ver scripts\backup-supabase.md)
# =============================================================================

param(
    [string]$BackupDir = "C:\Users\Usuário\Desktop\BACKUPS_SYNC_MOOD",
    [int]$MaxBackups = 30
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# 1. Configuracao — substitua DATABASE_URL pela connection string real
#    Formato: postgresql://postgres.[ref]:[senha]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
#    Obtenha em: https://supabase.com/dashboard/project/tigubwxotanaznqqxogf/settings/database
# ---------------------------------------------------------------------------
$DatabaseUrl = $env:SUPABASE_DB_URL
if (-not $DatabaseUrl) {
    Write-Error @"
Variavel de ambiente SUPABASE_DB_URL nao definida.
Defina antes de rodar:
  `$env:SUPABASE_DB_URL = 'postgresql://postgres.tigubwxotanaznqqxogf:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'

Ou edite este script e substitua `$DatabaseUrl manualmente.
"@
    exit 1
}

# ---------------------------------------------------------------------------
# 2. Verificar pg_dump disponivel
# ---------------------------------------------------------------------------
$pgDump = Get-Command "pg_dump" -ErrorAction SilentlyContinue
if (-not $pgDump) {
    Write-Error "pg_dump nao encontrado na PATH. Instale o PostgreSQL ou adicione pg_dump ao PATH. Ver scripts\backup-supabase.md"
    exit 1
}
Write-Host "[INFO] Usando pg_dump: $($pgDump.Source)"

# ---------------------------------------------------------------------------
# 3. Criar diretorio de backup se nao existir
# ---------------------------------------------------------------------------
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "[INFO] Diretorio de backup criado: $BackupDir"
}

# ---------------------------------------------------------------------------
# 4. Gerar nome do arquivo com timestamp
# ---------------------------------------------------------------------------
$Timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$BackupFile = Join-Path $BackupDir "sync-mood-db-$Timestamp.sql.gz"
$TempSqlFile = Join-Path $env:TEMP "sync-mood-db-$Timestamp.sql"

# ---------------------------------------------------------------------------
# 5. Executar pg_dump
# ---------------------------------------------------------------------------
Write-Host "[INFO] Iniciando backup em: $BackupFile"
$StartTime = Get-Date

& pg_dump `
    --no-password `
    --format=plain `
    --no-owner `
    --no-acl `
    --schema=public `
    "$DatabaseUrl" `
    --file="$TempSqlFile"

if ($LASTEXITCODE -ne 0) {
    Write-Error "pg_dump falhou com codigo $LASTEXITCODE"
    Remove-Item $TempSqlFile -ErrorAction SilentlyContinue
    exit 1
}

# ---------------------------------------------------------------------------
# 6. Comprimir com gzip (PowerShell nativo)
# ---------------------------------------------------------------------------
$inputStream  = [System.IO.File]::OpenRead($TempSqlFile)
$outputStream = [System.IO.File]::Create($BackupFile)
$gzipStream   = [System.IO.Compression.GZipStream]::new($outputStream, [System.IO.Compression.CompressionMode]::Compress)

$buffer = New-Object byte[] 65536
while (($read = $inputStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
    $gzipStream.Write($buffer, 0, $read)
}
$gzipStream.Close()
$outputStream.Close()
$inputStream.Close()

Remove-Item $TempSqlFile -Force

$Duration = (Get-Date) - $StartTime
$SizeKB    = [math]::Round((Get-Item $BackupFile).Length / 1KB, 1)
Write-Host "[OK] Backup concluido em $([math]::Round($Duration.TotalSeconds, 1))s — $SizeKB KB — $BackupFile"

# ---------------------------------------------------------------------------
# 7. Manter apenas os ultimos $MaxBackups backups (apagar os mais antigos)
# ---------------------------------------------------------------------------
$AllBackups = Get-ChildItem -Path $BackupDir -Filter "sync-mood-db-*.sql.gz" |
              Sort-Object LastWriteTime -Descending

if ($AllBackups.Count -gt $MaxBackups) {
    $ToDelete = $AllBackups | Select-Object -Skip $MaxBackups
    foreach ($old in $ToDelete) {
        Remove-Item $old.FullName -Force
        Write-Host "[CLEANUP] Removido backup antigo: $($old.Name)"
    }
}

Write-Host "[INFO] Total de backups mantidos: $([math]::Min($AllBackups.Count, $MaxBackups))"
