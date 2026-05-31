"""
Playwright: vai para a tela de login do Supabase e tira screenshot para análise.
"""
import asyncio
from playwright.async_api import async_playwright
import os

SCREENSHOT_DIR = r'C:\Users\Usuário\Desktop\sync-mood-saas\supabase\screenshots'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, args=['--no-sandbox'])
        ctx = await browser.new_context(viewport={'width': 1400, 'height': 900})
        page = await ctx.new_page()
        
        await page.goto('https://supabase.com/dashboard/sign-in', timeout=20000)
        await page.wait_for_timeout(3000)
        await page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'login_page.png'), full_page=True)
        
        print('URL:', page.url)
        print('Title:', await page.title())
        
        # Ver botoes disponíveis
        buttons = await page.query_selector_all('button')
        for btn in buttons:
            txt = await btn.inner_text()
            if txt.strip():
                print('Botao:', txt.strip()[:60])
        
        # Ver links OAuth
        links = await page.query_selector_all('a')
        for link in links:
            txt = await link.inner_text()
            href = await link.get_attribute('href')
            if ('github' in (href or '').lower() or 'google' in (href or '').lower() 
                or 'github' in txt.lower() or 'google' in txt.lower()):
                print(f'OAuth link: {txt.strip()} -> {href}')
        
        await page.wait_for_timeout(2000)
        await browser.close()

asyncio.run(run())
