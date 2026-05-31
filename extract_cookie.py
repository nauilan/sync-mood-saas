import sqlite3, shutil, os, sys

cookies_path = r'C:\Users\Usuário\AppData\Local\Google\Chrome\User Data\Default\Network\Cookies'
if not os.path.exists(cookies_path):
    cookies_path = r'C:\Users\Usuário\AppData\Local\Google\Chrome\User Data\Default\Cookies'

print('Path:', cookies_path)
tmp = r'C:\Users\Usuário\AppData\Local\Temp\cookies_tmp.db'
shutil.copy2(cookies_path, tmp)

conn = sqlite3.connect(tmp)
cur = conn.cursor()
cur.execute("SELECT host_key, name, path, length(encrypted_value) FROM cookies WHERE host_key LIKE '%supabase%' ORDER BY creation_utc DESC LIMIT 30")
rows = cur.fetchall()
print(f'Cookies supabase: {len(rows)}')
for r in rows:
    print(f'  host={r[0]} name={r[1]} path={r[2]} enc_len={r[3]}')
conn.close()
