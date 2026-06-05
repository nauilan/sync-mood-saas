# -*- coding: utf-8 -*-
"""
Investigacao especifica: dropdown de titular no wizard
"""
import json
import time
import os
import sys
from datetime import datetime
from playwright.sync_api import sync_playwright, Page

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "https://sync-mood-saas.vercel.app"
CPF = "04730581970"
SENHA = "admin123"
SCREENSHOTS_DIR = r"C:\Users\Usuário\Desktop\sync-mood-saas\screenshots"

def log(msg):
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")
    except UnicodeEncodeError:
        safe = msg.encode('ascii', errors='replace').decode('ascii')
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {safe}")

def ss(page: Page, name: str) -> str:
    path = os.path.join(SCREENSHOTS_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    log(f"  [SS] {path}")
    return path

def get_token(page: Page) -> str:
    token = page.evaluate("""() => {
        const pairs = document.cookie.split(';');
        const cookieMap = {};
        for (const pair of pairs) {
            const idx = pair.indexOf('=');
            if (idx < 0) continue;
            const key = pair.slice(0, idx).trim();
            const val = pair.slice(idx + 1).trim();
            cookieMap[key] = val;
        }
        const baseKeys = Object.keys(cookieMap).filter(k => /^sb-[a-z0-9]+-auth-token(\\.0)?$/.test(k));
        for (const baseKey of baseKeys) {
            const base = baseKey.replace(/\\.\\d+$/, '');
            if (cookieMap[base]) {
                try {
                    const decoded = decodeURIComponent(cookieMap[base]);
                    const parsed = JSON.parse(decoded);
                    if (parsed.access_token) return parsed.access_token;
                } catch(e) {}
            }
            let assembled = '';
            for (let i = 0; i < 10; i++) {
                const chunk = cookieMap[base + '.' + i];
                if (!chunk) break;
                assembled += decodeURIComponent(chunk);
            }
            if (assembled) {
                try {
                    const parsed = JSON.parse(assembled);
                    if (parsed.access_token) return parsed.access_token;
                } catch(e) {}
            }
        }
        return '';
    }""")
    return token or ""

def main():
    results = {}
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(viewport={"width": 1440, "height": 900}, locale="pt-BR")
        page = context.new_page()
        
        # Login
        page.goto(f"{BASE_URL}/auth/login", wait_until="networkidle", timeout=30000)
        page.locator("input[type='text'], input[placeholder*='CPF']").first.fill(CPF)
        page.locator("input[type='password']").first.fill(SENHA)
        page.locator("button[type='submit']").first.click()
        page.wait_for_url(f"{BASE_URL}/master/**", timeout=20000)
        time.sleep(2)
        log("Login OK")
        
        token = get_token(page)
        
        # Verifica API titulares sem filtro q
        r1 = page.evaluate("""async (args) => {
            const { baseUrl, token } = args;
            const r = await fetch(baseUrl + '/api/titulares?per_page=200&status=ativo', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const body = await r.json();
            return { status: r.status, total: body.total, count: body.data?.length, data: body.data?.slice(0,5) };
        }""", {"baseUrl": BASE_URL, "token": token})
        log(f"GET /api/titulares?per_page=200&status=ativo -> HTTP {r1['status']}")
        log(f"  total={r1.get('total')} count={r1.get('count')}")
        log(f"  data: {json.dumps(r1.get('data', []), ensure_ascii=False)}")
        results["api_titulares_sem_q"] = r1
        
        # Verifica API titulares com q=Autor
        r2 = page.evaluate("""async (args) => {
            const { baseUrl, token } = args;
            const r = await fetch(baseUrl + '/api/titulares?per_page=200&status=ativo&q=Autor', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const body = await r.json();
            return { status: r.status, total: body.total, count: body.data?.length, data: body.data?.slice(0,5) };
        }""", {"baseUrl": BASE_URL, "token": token})
        log(f"GET /api/titulares?q=Autor -> HTTP {r2['status']}")
        log(f"  total={r2.get('total')} count={r2.get('count')}")
        log(f"  data: {json.dumps(r2.get('data', []), ensure_ascii=False)}")
        results["api_titulares_com_q"] = r2
        
        # Navega para o wizard e vai direto ao Step 3
        page.goto(f"{BASE_URL}/master/contratos/novo", wait_until="networkidle", timeout=30000)
        time.sleep(3)
        
        # Seleciona tipo
        btns = page.locator("button").all()
        for btn in btns:
            txt = (btn.text_content() or "").strip()
            if "cessao" in txt.lower() or "cessão" in txt.lower():
                btn.click()
                time.sleep(0.3)
                log(f"Tipo selecionado: {txt[:40]}")
                break
        
        # Avança Step 1 → 2
        page.locator("button:has-text('Próximo'), button:has-text('Proximo')").first.click()
        time.sleep(1)
        
        # Avança Step 2 → 3
        page.locator("button:has-text('Próximo'), button:has-text('Proximo')").first.click()
        time.sleep(1)
        
        log("Agora no Step 3 (Partes)")
        ss(page, "debug_step3_inicial")
        
        # Inspeciona o DOM do Step 3
        dom_info = page.evaluate("""() => {
            const inputs = Array.from(document.querySelectorAll('input'));
            return inputs.map(inp => ({
                type: inp.type,
                placeholder: inp.placeholder,
                name: inp.name,
                id: inp.id,
                value: inp.value,
                className: inp.className.substring(0, 80)
            }));
        }""")
        log(f"Inputs no Step 3: {len(dom_info)}")
        for inp in dom_info:
            log(f"  type={inp['type']} placeholder='{inp['placeholder']}' name='{inp['name']}'")
        results["step3_inputs"] = dom_info
        
        # Encontra o input de busca de titular
        search_input = None
        for inp in dom_info:
            if "buscar" in inp.get("placeholder", "").lower() or "titular" in inp.get("placeholder", "").lower():
                search_input = inp
                break
        
        if search_input:
            log(f"Campo busca encontrado: placeholder='{search_input['placeholder']}'")
            
            # Clica no input e digita
            inp_el = page.locator(f"input[placeholder='{search_input['placeholder']}']").first
            inp_el.click()
            time.sleep(0.3)
            inp_el.fill("Au")
            time.sleep(1.5)
            ss(page, "debug_step3_busca_au")
            
            # Verifica o DOM após digitar
            dom_after = page.evaluate("""() => {
                // Procura o dropdown
                const divs = Array.from(document.querySelectorAll('div'));
                const dropdowns = divs.filter(d => {
                    const style = window.getComputedStyle(d);
                    return d.className.includes('absolute') || d.className.includes('z-50');
                });
                return dropdowns.map(d => ({
                    className: d.className.substring(0, 100),
                    text: d.textContent?.substring(0, 200),
                    visible: d.offsetParent !== null
                })).filter(d => d.text && d.text.trim().length > 0).slice(0, 10);
            }""")
            log(f"Divs absolute/z-50 após digitar 'Au': {len(dom_after)}")
            for d in dom_after:
                log(f"  visible={d['visible']} text='{d['text'][:80]}'")
            results["dom_after_au"] = dom_after
            
            # Tenta digitar mais
            inp_el.fill("Autor")
            time.sleep(1.5)
            ss(page, "debug_step3_busca_autor")
            
            dom_after2 = page.evaluate("""() => {
                const divs = Array.from(document.querySelectorAll('div'));
                const dropdowns = divs.filter(d => {
                    return d.className.includes('absolute') || d.className.includes('z-50');
                });
                return dropdowns.map(d => ({
                    className: d.className.substring(0, 100),
                    text: d.textContent?.substring(0, 300),
                    visible: d.offsetParent !== null,
                    childCount: d.children.length
                })).filter(d => d.text && d.text.trim().length > 0).slice(0, 15);
            }""")
            log(f"Divs absolute/z-50 após digitar 'Autor': {len(dom_after2)}")
            for d in dom_after2:
                log(f"  visible={d['visible']} children={d['childCount']} text='{d['text'][:100]}'")
            results["dom_after_autor"] = dom_after2
            
            # Verifica se o React state tem os titulares carregados
            react_state = page.evaluate("""() => {
                // Tenta acessar o React fiber para ver o state
                const inputs = document.querySelectorAll('input[placeholder*="Buscar"]');
                if (!inputs.length) return { error: 'input nao encontrado' };
                const inp = inputs[0];
                
                // Verifica se há algum elemento com texto "Autor Teste"
                const allText = document.body.textContent || '';
                const hasAutor = allText.includes('Autor Teste');
                
                // Verifica o dropdown visível
                const dropdownEl = document.querySelector('.z-50');
                const dropdownText = dropdownEl ? dropdownEl.textContent : null;
                
                return {
                    hasAutorInPage: hasAutor,
                    dropdownText: dropdownText?.substring(0, 200),
                    inputValue: inp.value,
                };
            }""")
            log(f"React state check: {json.dumps(react_state, ensure_ascii=False)}")
            results["react_state"] = react_state
            
        else:
            log("AVISO: Campo busca titular NAO encontrado")
            results["step3_busca_input"] = "nao_encontrado"
        
        # Testa POST direto com titular_id real
        log("\n=== Teste POST direto com titular_id real ===")
        titular_id = None
        if r1.get("data"):
            titular_id = r1["data"][0].get("id")
        elif r2.get("data"):
            titular_id = r2["data"][0].get("id")
        
        if titular_id:
            log(f"Usando titular_id: {titular_id}")
            r_post = page.evaluate("""async (args) => {
                const { baseUrl, token, titular_id } = args;
                const payload = {
                    tipo: 'cessao',
                    editora_id: 'bbbbbbbb-0000-0000-0000-000000000001',
                    titular_id: titular_id,
                    percentual_editora: 25,
                    percentual_autor: 75,
                    splits_direitos: {},
                    data_inicio: '2026-01-01',
                    data_fim: null,
                    prazo_indeterminado: true,
                    territorio: 'BR',
                    exclusividade: false,
                    status: 'assinado',
                    numero: 'CTR-VALIDACAO-022-FINAL',
                    observacoes: 'Contrato de validacao migration 022 - checklist final'
                };
                const r = await fetch(baseUrl + '/api/contratos', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const body = await r.json();
                return { status: r.status, body: body };
            }""", {"baseUrl": BASE_URL, "token": token, "titular_id": titular_id})
            
            log(f"POST /api/contratos -> HTTP {r_post['status']}")
            log(f"Response: {json.dumps(r_post.get('body', {}), ensure_ascii=False)[:400]}")
            results["post_direto"] = r_post
            
            if r_post["status"] == 201:
                data = r_post["body"].get("data", {})
                log(f"CONTRATO CRIADO!")
                log(f"  id: {data.get('id')}")
                log(f"  numero: {data.get('numero')}")
                log(f"  status: {data.get('status')}")
                log(f"  data_inicio: {data.get('data_inicio')}")
                log(f"  tipo: {data.get('tipo')}")
                results["contrato_criado"] = data
        
        # Verifica KPIs após criação
        r_kpi = page.evaluate("""async (args) => {
            const { baseUrl, token } = args;
            const r = await fetch(baseUrl + '/api/contratos?per_page=100', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const body = await r.json();
            return { status: r.status, total: body.total, kpis: body.kpis, statuses: body.data?.map(c => ({numero: c.numero, status: c.status, data_inicio: c.data_inicio})) };
        }""", {"baseUrl": BASE_URL, "token": token})
        log(f"\nGET /api/contratos -> HTTP {r_kpi['status']}")
        log(f"  total: {r_kpi.get('total')}")
        log(f"  kpis: {json.dumps(r_kpi.get('kpis', {}), ensure_ascii=False)}")
        log(f"  contratos: {json.dumps(r_kpi.get('statuses', []), ensure_ascii=False)}")
        results["api_final"] = r_kpi
        
        # Navega para listagem e screenshot
        page.goto(f"{BASE_URL}/master/contratos", wait_until="networkidle", timeout=30000)
        time.sleep(3)
        ss(page, "10_listagem_contratos")
        
        browser.close()
    
    # Salva
    out = os.path.join(SCREENSHOTS_DIR, "debug_titular_022.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    log(f"\nResultados: {out}")
    return results

if __name__ == "__main__":
    main()
