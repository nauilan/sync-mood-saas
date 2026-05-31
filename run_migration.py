"""
Script playwright para executar migration no Supabase SQL Editor.
Requer login no Supabase (captura screenshot se precisar fazer login).
"""
import asyncio
import os
import sys
from playwright.async_api import async_playwright

SQL_FILE = r'C:\Users\Usuário\Desktop\sync-mood-saas\supabase\MIGRATION_COMPLETA.sql'
PROJECT_URL = 'https://supabase.com/dashboard/project/tigubwxotanaznqqxogf/editor'
SCREENSHOT_DIR = r'C:\Users\Usuário\Desktop\sync-mood-saas\supabase\screenshots'

os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def run():
    with open(SQL_FILE, 'r', encoding='utf-8-sig') as f:
        sql = f.read()
    
    print(f'SQL: {len(sql)} chars, {sql.count(chr(10))} linhas')
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        
        # Tentar com storage state do Chrome se existir
        ctx = await browser.new_context(
            viewport={'width': 1400, 'height': 900}
        )
        page = await ctx.new_page()
        
        print('Navegando para Supabase SQL Editor...')
        await page.goto(PROJECT_URL, timeout=30000)
        await page.wait_for_timeout(3000)
        
        await page.screenshot(path=os.path.join(SCREENSHOT_DIR, '01_inicial.png'))
        print('Screenshot: 01_inicial.png')
        
        title = await page.title()
        url = page.url
        print(f'Titulo: {title}')
        print(f'URL: {url}')
        
        # Verificar se esta na pagina de login
        if 'sign-in' in url or 'auth' in url or 'login' in url:
            print('PRECISA DE LOGIN - tentando email/github...')
            await page.screenshot(path=os.path.join(SCREENSHOT_DIR, '02_login.png'))
            await browser.close()
            return False
        
        # Verificar se carregou o editor SQL
        print('Aguardando editor SQL...')
        try:
            await page.wait_for_selector('.monaco-editor, [data-testid="sql-editor"], textarea.code-editor, .cm-editor', timeout=15000)
            print('Editor SQL encontrado!')
            await page.screenshot(path=os.path.join(SCREENSHOT_DIR, '03_editor.png'))
        except:
            print('Editor nao encontrado, verifique screenshot')
            await page.screenshot(path=os.path.join(SCREENSHOT_DIR, '03_editor_timeout.png'))
            await browser.close()
            return False
        
        print('Executando SQL...')
        # Tentar clicar em "New query" ou similar
        try:
            new_btn = await page.query_selector('button:has-text("New query"), [data-testid="new-query-btn"]')
            if new_btn:
                await new_btn.click()
                await page.wait_for_timeout(1000)
        except:
            pass
        
        # Inserir SQL no editor (Monaco ou CodeMirror)
        editor = await page.query_selector('.monaco-editor .inputarea, .cm-content, .CodeMirror textarea')
        if editor:
            await editor.click()
            await page.keyboard.press('Control+A')
            await page.keyboard.press('Delete')
            await page.wait_for_timeout(500)
            
            # Digitar SQL em chunks
            chunk_size = 5000
            for i in range(0, len(sql), chunk_size):
                chunk = sql[i:i+chunk_size]
                await page.keyboard.type(chunk, delay=0)
            
            print('SQL inserido, executando...')
            await page.keyboard.press('Control+Return')
            
            await page.wait_for_timeout(8000)
            await page.screenshot(path=os.path.join(SCREENSHOT_DIR, '04_resultado.png'))
            print('Screenshot: 04_resultado.png')
        else:
            print('Editor nao encontrado para inserir SQL')
            await page.screenshot(path=os.path.join(SCREENSHOT_DIR, '04_sem_editor.png'))
        
        await browser.close()
        return True

if __name__ == '__main__':
    result = asyncio.run(run())
    print('Resultado:', 'OK' if result else 'FALHOU')
