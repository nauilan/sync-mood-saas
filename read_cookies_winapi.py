import ctypes, ctypes.wintypes, os, io, struct, sqlite3, json, sys

# Abrir arquivo com FILE_SHARE_DELETE|READ|WRITE (bypass lock)
GENERIC_READ = 0x80000000
FILE_SHARE_READ = 0x1
FILE_SHARE_WRITE = 0x2
FILE_SHARE_DELETE = 0x4
OPEN_EXISTING = 3
FILE_ATTRIBUTE_NORMAL = 0x80

cookies_path = r'C:\Users\Usuário\AppData\Local\Google\Chrome\User Data\Default\Network\Cookies'

kernel32 = ctypes.windll.kernel32
handle = kernel32.CreateFileW(
    cookies_path,
    GENERIC_READ,
    FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
    None,
    OPEN_EXISTING,
    FILE_ATTRIBUTE_NORMAL,
    None
)

if handle == -1:
    err = ctypes.GetLastError()
    print(f'Falha ao abrir arquivo: erro {err}')
    sys.exit(1)

print('Arquivo aberto via WinAPI!')

# Ler conteudo
size = kernel32.GetFileSize(handle, None)
print(f'Tamanho: {size} bytes')

buf = (ctypes.c_byte * size)()
bytes_read = ctypes.c_ulong(0)
kernel32.ReadFile(handle, buf, size, ctypes.byref(bytes_read), None)
kernel32.CloseHandle(handle)

# Salvar copia
tmp_path = r'C:\Users\Usuário\AppData\Local\Temp\chrome_cookies_copy.db'
with open(tmp_path, 'wb') as f:
    f.write(bytes(buf[:bytes_read.value]))
print(f'Copia salva em {tmp_path} ({bytes_read.value} bytes)')

# Ler SQLite
conn = sqlite3.connect(tmp_path)
cur = conn.cursor()
cur.execute("SELECT host_key, name, path, length(encrypted_value) FROM cookies WHERE host_key LIKE '%supabase%' LIMIT 30")
rows = cur.fetchall()
print(f'\nCookies supabase: {len(rows)}')
for r in rows:
    print(f'  host={r[0]} name={r[1]} enc_len={r[3]}')
conn.close()
