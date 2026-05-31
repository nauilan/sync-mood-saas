import urllib.request, json

for port in [9222, 9229, 9230, 9333]:
    try:
        url = f'http://localhost:{port}/json/version'
        with urllib.request.urlopen(url, timeout=2) as r:
            data = json.loads(r.read())
            browser = data.get('Browser', '?')
            print(f'CDP porta {port}: {browser}')
    except Exception as e:
        pass
print('CDP scan completo')
