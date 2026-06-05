# -*- coding: utf-8 -*-
"""
Investigacao adicional: estado do banco, wizard, bridge analitica
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

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def log(msg):
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")
    except UnicodeEncodeError:
        safe = msg.encode('ascii', errors='replace').decode('ascii')
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {safe}")

def ss(page: Page, name: str) -> str:
    path = os.path.join(SCREENSHOTS_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    log(f"  [screenshot] {path}")
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

def login(page: Page):
    page.goto(f"{BASE_URL}/auth/login", wait_until="networkidle", timeout=30000)
    page.locator("input[type='text'], input[placeholder*='CPF'], input[name*='cpf']").first.fill(CPF)
    page.locator("input[type='password']").first.fill(SENHA)
    page.locator("button[type='submit'], button:has-text('Entrar')").first.click()
    page.wait_for_url(f"{BASE_URL}/master/**", timeout=15000)
    log(f"Login OK - {page.url}")

def main():
    results = {}
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(viewport={"width": 1440, "height": 900}, locale="pt-BR")
        page = context.new_page()
        
        login(page)
        token = get_token(page)
        log(f"Token: {'OK' if token else 'FALHOU'}")
        
        # ── 1. Testa POST com campos corretos do banco (data_inicio, nao vigencia_inicio) ──
        log("\n=== TESTE 1: POST com campos corretos do banco ===")
        r1 = page.evaluate("""async (args) => {
            const { baseUrl, token } = args;
            const r = await fetch(baseUrl + '/api/contratos', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numero: 'CTR-PROBE-DATA-INICIO',
                    tipo: 'cessao',
                    status: 'ativo',
                    data_inicio: '2026-01-01',
                    prazo_indeterminado: true,
                    territorio: 'BR',
                    titular_id: null,
                    editora_id: null
                })
            });
            const body = await r.json();
            return { status: r.status, body };
        }""", {"baseUrl": BASE_URL, "token": token})
        log(f"  POST com data_inicio, status=ativo -> HTTP {r1['status']}")
        log(f"  Response: {json.dumps(r1.get('body', {}), ensure_ascii=False)[:300]}")
        results["test1_data_inicio_ativo"] = r1
        
        # ── 2. Testa POST com status='assinado' e data_inicio ──
        log("\n=== TESTE 2: POST com status=assinado e data_inicio ===")
        r2 = page.evaluate("""async (args) => {
            const { baseUrl, token } = args;
            const r = await fetch(baseUrl + '/api/contratos', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numero: 'CTR-PROBE-ASSINADO',
                    tipo: 'cessao',
                    status: 'assinado',
                    data_inicio: '2026-01-01',
                    prazo_indeterminado: true,
                    territorio: 'BR'
                })
            });
            const body = await r.json();
            return { status: r.status, body };
        }""", {"baseUrl": BASE_URL, "token": token})
        log(f"  POST com data_inicio, status=assinado -> HTTP {r2['status']}")
        log(f"  Response: {json.dumps(r2.get('body', {}), ensure_ascii=False)[:300]}")
        results["test2_data_inicio_assinado"] = r2
        
        # ── 3. Testa POST com vigencia_inicio (campo do wizard) ──
        log("\n=== TESTE 3: POST com vigencia_inicio (campo do wizard) ===")
        r3 = page.evaluate("""async (args) => {
            const { baseUrl, token } = args;
            const r = await fetch(baseUrl + '/api/contratos', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numero: 'CTR-PROBE-VIGENCIA',
                    tipo: 'cessao',
                    status: 'assinado',
                    vigencia_inicio: '2026-01-01',
                    prazo_indeterminado: true,
                    territorio: 'BR'
                })
            });
            const body = await r.json();
            return { status: r.status, body };
        }""", {"baseUrl": BASE_URL, "token": token})
        log(f"  POST com vigencia_inicio, status=assinado -> HTTP {r3['status']}")
        log(f"  Response: {json.dumps(r3.get('body', {}), ensure_ascii=False)[:300]}")
        results["test3_vigencia_inicio_assinado"] = r3
        
        # ── 4. Verifica contratos existentes e seus campos ──
        log("\n=== TESTE 4: GET contratos - campos reais ===")
        r4 = page.evaluate("""async (args) => {
            const { baseUrl, token } = args;
            const r = await fetch(baseUrl + '/api/contratos?per_page=10', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const body = await r.json();
            return { status: r.status, body };
        }""", {"baseUrl": BASE_URL, "token": token})
        log(f"  GET contratos -> HTTP {r4['status']}")
        contratos = r4.get("body", {}).get("data", [])
        kpis = r4.get("body", {}).get("kpis", {})
        log(f"  KPIs: {json.dumps(kpis, ensure_ascii=False)}")
        for c in contratos:
            log(f"  Contrato: numero={c.get('numero')} status={c.get('status')} tipo={c.get('tipo')}")
            log(f"    Campos: data_inicio={c.get('data_inicio')} vigencia_inicio={c.get('vigencia_inicio')} data_fim={c.get('data_fim')}")
        results["test4_get_contratos"] = {"kpis": kpis, "contratos": contratos}
        
        # ── 5. Wizard - navega e captura o saveError ──
        log("\n=== TESTE 5: Wizard - captura saveError ===")
        page.goto(f"{BASE_URL}/master/contratos/novo", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        
        # Seleciona tipo cessao_parcial
        try:
            btns = page.locator("button").all()
            for btn in btns:
                txt = btn.text_content() or ""
                if "cessao parcial" in txt.lower() or "cessão parcial" in txt.lower():
                    btn.click()
                    time.sleep(0.3)
                    break
        except: pass
        
        # Seleciona editora (primeiro select com options)
        try:
            selects = page.locator("select").all()
            for sel in selects:
                opts = sel.locator("option").all()
                if len(opts) > 1:
                    sel.select_option(index=1)
                    break
        except: pass
        
        # Avanca todos os steps ate o 9
        for i in range(8):
            try:
                next_btn = page.locator("button:has-text('Proximo'), button:has-text('Próximo')").first
                if next_btn.count() > 0:
                    next_btn.click()
                    time.sleep(0.5)
            except: pass
            
            if i == 4:  # Step 6 - periodo
                try:
                    date_inputs = page.locator("input[type='date']").all()
                    if date_inputs:
                        date_inputs[0].fill("2026-01-01")
                    checkbox = page.locator("input[type='checkbox']").first
                    if checkbox.count() > 0 and not checkbox.is_checked():
                        checkbox.click()
                except: pass
        
        ss(page, "20_wizard_step9_final")
        
        # Clica Criar Contrato e captura o erro
        network_calls = []
        def on_resp(resp):
            if "/api/contratos" in resp.url and resp.request.method == "POST":
                try:
                    body = resp.json()
                except:
                    body = None
                network_calls.append({"status": resp.status, "body": body, "url": resp.url})
        
        page.on("response", on_resp)
        
        try:
            criar = page.locator("button:has-text('Criar Contrato')").first
            if criar.count() > 0:
                criar.click()
                time.sleep(3)
                log("  Botao Criar Contrato clicado")
            else:
                log("  Botao Criar Contrato NAO encontrado")
        except Exception as ex:
            log(f"  Erro: {ex}")
        
        # Captura saveError visivel
        time.sleep(1)
        ss(page, "21_wizard_after_criar")
        
        error_text = ""
        try:
            err_el = page.locator("p.text-rose-400, p[class*='rose']").first
            if err_el.count() > 0:
                error_text = err_el.text_content() or ""
                log(f"  saveError visivel: {error_text}")
        except: pass
        
        log(f"  Network calls POST: {len(network_calls)}")
        for nc in network_calls:
            log(f"    HTTP {nc['status']} - {json.dumps(nc.get('body', {}), ensure_ascii=False)[:200]}")
        
        results["test5_wizard"] = {
            "network_calls": network_calls,
            "save_error": error_text
        }
        
        # ── 6. Bridge analitica - pagina obras ──
        log("\n=== TESTE 6: Bridge analitica na pagina /master/obras ===")
        page.goto(f"{BASE_URL}/master/obras", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        ss(page, "22_obras_page")
        
        # Procura botao "Analitico" na pagina de obras (nao no detalhe)
        analitico_btns = page.locator("button:has-text('Analítico'), button:has-text('Analitico')").all()
        log(f"  Botoes Analitico na pagina obras: {len(analitico_btns)}")
        
        if analitico_btns:
            analitico_btns[0].click()
            time.sleep(2)
            ss(page, "23_obras_analitico_result")
            
            # Captura resultado
            result_el = page.locator("[class*='emerald'], [class*='analitico']").all_text_contents()
            log(f"  Resultado analitico: {result_el[:3]}")
            results["test6_bridge"] = {"status": "clicado", "result": result_el[:3]}
        else:
            # Tenta abrir uma obra e procurar la
            obra_links = page.locator("a[href*='/master/obras/']").all()
            log(f"  Obras na listagem: {len(obra_links)}")
            if obra_links:
                obra_url = obra_links[0].get_attribute("href")
                log(f"  Abrindo obra: {obra_url}")
                page.goto(f"{BASE_URL}{obra_url}", wait_until="networkidle", timeout=15000)
                time.sleep(2)
                ss(page, "23_obra_detalhe_v2")
                
                # Procura botao analitico
                analitico_btns2 = page.locator("button:has-text('Analítico'), button:has-text('Analitico'), button:has-text('analitico')").all()
                log(f"  Botoes Analitico no detalhe: {len(analitico_btns2)}")
                
                # Captura todo o texto da pagina para debug
                page_text = page.locator("body").text_content() or ""
                if "analitico" in page_text.lower() or "analítico" in page_text.lower():
                    log("  Palavra 'analitico' encontrada na pagina")
                    results["test6_bridge"] = {"status": "palavra_encontrada_mas_botao_nao"}
                else:
                    log("  Palavra 'analitico' NAO encontrada na pagina de detalhe")
                    results["test6_bridge"] = {"status": "nao_encontrado"}
        
        # ── 7. Verifica API obras/analitico ──
        log("\n=== TESTE 7: API obras/analitico ===")
        r7 = page.evaluate("""async (args) => {
            const { baseUrl, token } = args;
            // Primeiro pega lista de obras
            const r = await fetch(baseUrl + '/api/obras?per_page=5', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const body = await r.json();
            return { status: r.status, body };
        }""", {"baseUrl": BASE_URL, "token": token})
        log(f"  GET /api/obras -> HTTP {r7['status']}")
        obras = r7.get("body", {}).get("data", [])
        log(f"  Obras: {len(obras)}")
        
        if obras:
            obra_id = obras[0].get("id")
            log(f"  Testando analitico para obra {obra_id}...")
            r7b = page.evaluate("""async (args) => {
                const { baseUrl, token, obraId } = args;
                const r = await fetch(baseUrl + '/api/obras/' + obraId + '/analitico', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const body = await r.json();
                return { status: r.status, body };
            }""", {"baseUrl": BASE_URL, "token": token, "obraId": obra_id})
            log(f"  GET /api/obras/{obra_id}/analitico -> HTTP {r7b['status']}")
            log(f"  Response: {json.dumps(r7b.get('body', {}), ensure_ascii=False)[:400]}")
            results["test7_analitico_api"] = r7b
        
        browser.close()
    
    # Salva resultados
    out_path = os.path.join(SCREENSHOTS_DIR, "investigate_022.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    log(f"\nResultados salvos em: {out_path}")
    return results

if __name__ == "__main__":
    main()
