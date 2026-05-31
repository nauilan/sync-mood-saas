# Guia de Backup Automático do Supabase (Windows)

## Pré-requisitos

### 1. Instalar pg_dump no Windows

O `pg_dump` faz parte do cliente PostgreSQL. Instale de uma das formas:

#### Opção A — PostgreSQL completo (recomendado)
1. Acesse https://www.postgresql.org/download/windows/
2. Baixe o instalador do PostgreSQL 16 (ou superior)
3. Durante a instalação, selecione apenas **Command Line Tools** se não quiser o servidor completo
4. O instalador adiciona automaticamente `C:\Program Files\PostgreSQL\16\bin` ao PATH

#### Opção B — pg_dump isolado via EDB
1. Acesse https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. Instale o PostgreSQL e desmarque o servidor após a instalação

#### Verificar instalação
```powershell
pg_dump --version
# Esperado: pg_dump (PostgreSQL) 16.x
```

---

## Obter a Connection String do Supabase

1. Acesse o dashboard: https://supabase.com/dashboard/project/tigubwxotanaznqqxogf/settings/database
2. Na seção **Connection string**, selecione o modo **URI**
3. Copie a string no formato:
   ```
   postgresql://postgres.tigubwxotanaznqqxogf:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```
4. Substitua `[SENHA]` pela senha do banco (configurada no Supabase)

> **NUNCA** commite a connection string no repositório. Use variável de ambiente.

---

## Executar o Backup Manualmente

```powershell
# Definir a connection string (sessão atual)
$env:SUPABASE_DB_URL = 'postgresql://postgres.tigubwxotanaznqqxogf:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'

# Executar o backup
cd C:\Users\Usuário\Desktop\sync-mood-saas
.\scripts\backup-supabase.ps1
```

Os backups são salvos em: `C:\Users\Usuário\Desktop\BACKUPS_SYNC_MOOD\`  
Formato: `sync-mood-db-YYYYMMDD-HHMM.sql.gz`  
Retidos: últimos 30 backups (os mais antigos são apagados automaticamente).

---

## Agendar via Task Scheduler do Windows (diário às 03h)

### Opção A — PowerShell (uma linha)

Abra o PowerShell como **Administrador** e execute:

```powershell
$action  = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -WindowStyle Hidden -Command `$env:SUPABASE_DB_URL='postgresql://postgres.tigubwxotanaznqqxogf:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'; & 'C:\Users\Usuário\Desktop\sync-mood-saas\scripts\backup-supabase.ps1'"

$trigger = New-ScheduledTaskTrigger -Daily -At "03:00"

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName "SyncMood-SupabaseBackup" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -RunLevel Highest `
    -Force
```

### Opção B — Interface gráfica

1. Abra **Task Scheduler** (Agendador de Tarefas) no Windows
2. Clique em **Create Task** (Criar Tarefa)
3. **General**: Nome = `SyncMood-SupabaseBackup`; marque "Run with highest privileges"
4. **Triggers**: New → Daily → Start: `03:00:00`
5. **Actions**: New → Program: `powershell.exe`  
   Arguments:
   ```
   -NonInteractive -WindowStyle Hidden -Command "$env:SUPABASE_DB_URL='postgresql://postgres.tigubwxotanaznqqxogf:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'; & 'C:\Users\Usuário\Desktop\sync-mood-saas\scripts\backup-supabase.ps1'"
   ```
6. Clique OK e insira sua senha do Windows quando solicitado

---

## Verificar Backups Gerados

```powershell
Get-ChildItem "C:\Users\Usuário\Desktop\BACKUPS_SYNC_MOOD\" | Sort-Object LastWriteTime -Descending | Select-Object Name, LastWriteTime, @{N='KB';E={[math]::Round($_.Length/1KB,1)}}
```

## Restaurar um Backup

```powershell
# Descomprimir
$input  = [System.IO.File]::OpenRead("C:\Users\Usuário\Desktop\BACKUPS_SYNC_MOOD\sync-mood-db-YYYYMMDD-HHMM.sql.gz")
$output = [System.IO.File]::Create("C:\Temp\restore.sql")
$gz     = [System.IO.Compression.GZipStream]::new($input, [System.IO.Compression.CompressionMode]::Decompress)
$gz.CopyTo($output); $gz.Close(); $output.Close(); $input.Close()

# Restaurar (use com cuidado — sobrescreve dados existentes)
psql $env:SUPABASE_DB_URL -f "C:\Temp\restore.sql"
```
