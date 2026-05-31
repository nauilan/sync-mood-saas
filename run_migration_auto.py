"""
Migration automática do Supabase.
Uso: python run_migration_auto.py
1. Abre o browser Chromium
2. Aguarda o usuário fazer login no Supabase (1x)
3. Executa os 4 blocos SQL automaticamente
"""
import asyncio
import os
import sys
from playwright.async_api import async_playwright

BASE = r'C:\Users\Usuário\Desktop\sync-mood-saas\supabase'
BLOCOS = [
    'BLOCO_1_DROP_ENUMS_TENANT_EDITORAS.sql',
    'BLOCO_2_TITULARES_CONTRATOS_OBRAS.sql',
    'BLOCO_3_RECEBIMENTOS_DISTRIBUICAO.sql',
    'BLOCO_4_RLS_SEED.sql',
]
PROJECT_REF = 'tigubwxotanaznqqxogf'
EDITOR_URL = f'https://supabase.com/dashboard/project/{PROJECT_REF}/editor'
SS_DIR = os.path.join(BASE, 'screenshots')
os.makedirs(SS_DIR, exist_ok=True)

async def wait_for_login(page):
    """Aguarda o usuário fazer login e chegar no dashboard."""
    print('\n[AGUARDANDO LOGIN] Faça login no browser que abriu...')
    max_wait = 300  # 5 minutos
    for i in range(max_wait):
        url = page.url
        if PROJECT_REF in url and 'sign-in' not in url and 'auth' not in url:
            print(f'[OK] Login detectado! URL: {url}')
            return True
        if i % 10 == 0:
            print(f'  Aguardando... {i}s / {max_wait}s')
        await asyncio.sleep(1)
    print('[TIMEOUT] Login não detectado em 5 minutos.')
    return False

async def execute_sql_block(page, bloco_name, sql):
    """Executa um bloco SQL no editor."""
    print(f'\n--- BLOCO: {bloco_name} ---')
    
    # Navegar para o editor com nova query
    await page.goto(EDITOR_URL, timeout=20000)
    await page.wait_for_timeout(3000)
    await page.screenshot(path=os.path.join(SS_DIR, f'{bloco_name}_before.png'))
    
    # Clicar em "New query" se disponível
    try:
        new_q = page.locator('button:has-text("New query"), [aria-label="New query"]')
        if await new_q.count() > 0:
            await new_q.first.click()
            await page.wait_for_timeout(1500)
    except:
        pass
    
    # Encontrar o editor de código
    editor = None
    selectors = [
        '.monaco-editor .inputarea',
        '.cm-content',
        '.CodeMirror textarea',
        'textarea[class*="code"]',
        '[role="textbox"]',
    ]
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if await el.count() > 0:
                editor = el
                print(f'  Editor encontrado: {sel}')
                break
        except:
            pass
    
    if not editor:
        print('  ERRO: Editor SQL não encontrado!')
        await page.screenshot(path=os.path.join(SS_DIR, f'{bloco_name}_no_editor.png'))
        return False
    
    # Limpar e inserir SQL
    await editor.click()
    await page.keyboard.press('Control+a')
    await page.wait_for_timeout(200)
    
    # Usar clipboard para inserir SQL grande (muito mais rápido que keyboard.type)
    import subprocess
    # Salvar SQL em arquivo temp e copiar para clipboard
    tmp_sql = os.path.join(BASE, '_tmp_sql.txt')
    with open(tmp_sql, 'w', encoding='utf-8') as f:
        f.write(sql)
    subprocess.run(['powershell', '-Command', 
        f'Get-Content "{tmp_sql}" -Raw | Set-Clipboard'], 
        capture_output=True)
    
    await editor.click()
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Control+v')
    await page.wait_for_timeout(2000)
    
    # Executar
    print(f'  Executando {len(sql)} chars...')
    await page.keyboard.press('Control+Return')
    
    # Aguardar resultado (até 60s)
    await page.wait_for_timeout(5000)
    
    # Verificar se houve erro
    for wait in range(12):
        try:
            error_el = page.locator('.text-destructive, .error-message, [data-testid="query-error"]')
            success_el = page.locator('.text-success, [data-testid="query-success"], .result-header')
            
            if await error_el.count() > 0:
                err_text = await error_el.first.inner_text()
                print(f'  ERRO SQL: {err_text[:200]}')
                await page.screenshot(path=os.path.join(SS_DIR, f'{bloco_name}_error.png'))
                return False
            
            if await success_el.count() > 0:
                suc_text = await success_el.first.inner_text()
                print(f'  SUCESSO: {suc_text[:100]}')
                break
        except:
            pass
        await asyncio.sleep(3)
    
    await page.screenshot(path=os.path.join(SS_DIR, f'{bloco_name}_result.png'))
    print(f'  Screenshot: {bloco_name}_result.png')
    return True

async def main():
    print('='*60)
    print('SYNC MOOD - MIGRATION AUTOMÁTICA SUPABASE')
    print('='*60)
    
    # Verificar arquivos
    for bloco in BLOCOS:
        path = os.path.join(BASE, bloco)
        if not os.path.exists(path):
            print(f'ERRO: Arquivo não encontrado: {path}')
            return
    print(f'4 blocos SQL encontrados.')
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=['--no-sandbox', '--disable-dev-shm-usage'],
            slow_mo=100
        )
        ctx = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await ctx.new_page()
        
        # Ir para o login
        print('\nAbrindo Supabase...')
        await page.goto(EDITOR_URL, timeout=20000)
        await page.wait_for_timeout(2000)
        
        # Aguardar login
        if 'sign-in' in page.url or 'auth' in page.url:
            logged_in = await wait_for_login(page)
            if not logged_in:
                await browser.close()
                return
        
        print('\n[INICIANDO MIGRATION]')
        
        for i, bloco_name in enumerate(BLOCOS, 1):
            path = os.path.join(BASE, bloco_name)
            with open(path, 'r', encoding='utf-8') as f:
                sql = f.read()
            
            print(f'\n[{i}/4] {bloco_name} ({len(sql.splitlines())} linhas)')
            
            success = await execute_sql_block(page, bloco_name, sql)
            
            if success:
                print(f'[{i}/4] OK')
            else:
                print(f'[{i}/4] FALHOU - verifique screenshot em {SS_DIR}')
                resp = input('Continuar com próximo bloco? (s/n): ')
                if resp.lower() != 's':
                    break
            
            await asyncio.sleep(2)
        
        print('\n[CONCLUÍDO] Verifique as screenshots em:', SS_DIR)
        input('\nPressione Enter para fechar o browser...')
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
