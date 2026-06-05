# -*- coding: utf-8 -*-
"""
Validacao do modulo de contratos apos migration 022
URL: https://sync-mood-saas.vercel.app
Login: CPF 04730581970 / Senha: admin123
"""
import json
import time
import os
import sys
from datetime import datetime
from playwright.sync_api import sync_playwright, Page

# Fix encoding for Windows console
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "https://sync-mood-saas.vercel.app"
CPF = "04730581970"
SENHA = "admin123"
SCREENSHOTS_DIR = r"C:\Users\Usuário\Desktop\sync-mood-saas\screenshots"

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

report = {
    "migration_022": None,
    "post_status": None,
    "post_response": None,
    "contrato_status": None,
    "top_show_count": None,
    "kpi_em_vigor": None,
    "kpi_total": None,
    "kpis_raw": None,
    "contratos_listagem": [],
    "bridge_obras": None,
    "bridge_result": None,
    "erros": [],
    "screenshots": [],
    "api_contratos_raw": None,
    "titulares_count": None,
    "editoras_raw": None,
}

def ss(page: Page, name: str) -> str:
    path = os.path.join(SCREENSHOTS_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    report["screenshots"].append(path)
    print(f"  [screenshot] {path}")
    return path

def log(msg):
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")
    except UnicodeEncodeError:
        safe = msg.encode('ascii', errors='replace').decode('ascii')
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {safe}")

def login(page: Page):
    log("Fazendo login...")
    page.goto(f"{BASE_URL}/auth/login", wait_until="networkidle", timeout=30000)
    ss(page, "00_login_page")
    
    # Preenche CPF
    cpf_input = page.locator("input[type='text'], input[placeholder*='CPF'], input[name*='cpf'], input[id*='cpf']").first
    cpf_input.fill(CPF)
    
    # Preenche senha
    senha_input = page.locator("input[type='password']").first
    senha_input.fill(SENHA)
    
    ss(page, "01_login_filled")
    
    # Clica no botão de login
    btn = page.locator("button[type='submit'], button:has-text('Entrar'), button:has-text('Login'), button:has-text('Acessar')").first
    btn.click()
    
    # Aguarda navegação
    page.wait_for_url(f"{BASE_URL}/master/**", timeout=15000)
    log(f"Login OK - URL: {page.url}")
    ss(page, "02_after_login")

def get_token(page: Page) -> str:
    """Extrai o access_token dos cookies Supabase SSR (sb-xxx-auth-token ou chunks .0/.1)"""
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
        
        // Encontrar chaves base sb-xxx-auth-token
        const baseKeys = Object.keys(cookieMap).filter(k => /^sb-[a-z0-9]+-auth-token(\\.0)?$/.test(k));
        for (const baseKey of baseKeys) {
            const base = baseKey.replace(/\\.\\d+$/, '');
            
            // Cookie unico
            if (cookieMap[base]) {
                try {
                    const decoded = decodeURIComponent(cookieMap[base]);
                    const parsed = JSON.parse(decoded);
                    if (parsed.access_token) return parsed.access_token;
                } catch(e) {}
            }
            
            // Chunks .0, .1, ...
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
        
        // Fallback: localStorage
        const lsKeys = Object.keys(localStorage);
        for (const k of lsKeys) {
            try {
                const v = JSON.parse(localStorage.getItem(k) || '{}');
                if (v && v.access_token) return v.access_token;
                if (v && v.session && v.session.access_token) return v.session.access_token;
            } catch(e) {}
        }
        
        return '';
    }""")
    return token or ""

def etapa0_migration(page: Page):
    log("=== ETAPA 0: Verificar migration 022 ===")
    
    # Debug: inspeciona cookies e localStorage
    debug_info = page.evaluate("""() => {
        const cookieKeys = document.cookie.split(';').map(c => c.trim().split('=')[0]);
        const lsKeys = Object.keys(localStorage);
        return { cookieKeys, lsKeys };
    }""")
    log(f"  Cookies keys: {debug_info.get('cookieKeys', [])}")
    log(f"  LocalStorage keys: {debug_info.get('lsKeys', [])}")
    
    # Testa POST com status 'assinado'
    token = get_token(page)
    log(f"  Token obtido: {'sim' if token else 'NÃO'}")
    
    result = page.evaluate("""async (args) => {
        const { baseUrl, token } = args;
        try {
            const r = await fetch(baseUrl + '/api/contratos', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    numero: 'CTR-TEST-022-PROBE',
                    tipo: 'cessao_parcial',
                    status: 'assinado',
                    vigencia_inicio: '2026-01-01',
                    prazo_indeterminado: true,
                    territorio: 'BR'
                })
            });
            const body = await r.json();
            return { status: r.status, body: body };
        } catch(e) {
            return { status: -1, error: e.message };
        }
    }""", {"baseUrl": BASE_URL, "token": token})
    
    log(f"  POST /api/contratos status=assinado → HTTP {result.get('status')}")
    log(f"  Response: {json.dumps(result.get('body', result), ensure_ascii=False)[:300]}")
    
    report["post_status"] = result.get("status")
    report["post_response"] = result.get("body", result)
    
    if result.get("status") == 201:
        report["migration_022"] = "APLICADA"
        log("  ✅ Migration 022 APLICADA — enum aceita 'assinado'")
        # Guarda o ID do contrato de probe para referência
        if result.get("body", {}).get("data", {}).get("id"):
            report["probe_contrato_id"] = result["body"]["data"]["id"]
    elif result.get("status") == 500:
        report["migration_022"] = "NÃO APLICADA"
        log("  ❌ Migration 022 NÃO APLICADA — enum rejeita 'assinado'")
        report["erros"].append(f"Migration 022 não aplicada: POST retornou 500 — {result.get('body', {}).get('error', '')}")
    else:
        report["migration_022"] = f"INCERTO (HTTP {result.get('status')})"
        log(f"  ⚠️ Status inesperado: {result.get('status')}")

def etapa1_listagem_existente(page: Page):
    log("=== ETAPA 1: Verificar listagem existente ===")
    page.goto(f"{BASE_URL}/master/contratos", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    ss(page, "03_contratos_listagem_inicial")
    
    # Captura texto da página para análise
    content = page.content()
    
    # Verifica CTR-WIZARD-022
    if "CTR-WIZARD-022" in content:
        log("  Contrato CTR-WIZARD-022 encontrado na listagem")
        report["ctr_wizard_022_existe"] = True
    else:
        log("  Contrato CTR-WIZARD-022 NÃO encontrado")
        report["ctr_wizard_022_existe"] = False

def etapa2_wizard(page: Page):
    log("=== ETAPA 2: Criar contrato pelo wizard ===")
    
    # Primeiro verifica editoras disponíveis
    token = get_token(page)
    editoras_result = page.evaluate("""async (args) => {
        const { baseUrl, token } = args;
        try {
            const r = await fetch(baseUrl + '/api/editoras', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const body = await r.json();
            return { status: r.status, body: body };
        } catch(e) {
            return { status: -1, error: e.message };
        }
    }""", {"baseUrl": BASE_URL, "token": token})
    
    log(f"  GET /api/editoras → HTTP {editoras_result.get('status')}")
    editoras_body = editoras_result.get("body", {})
    editoras = editoras_body.get("editoras", [])
    log(f"  Editoras encontradas: {len(editoras)}")
    for e in editoras:
        log(f"    - {e.get('nome_fantasia', e.get('nome', '?'))} (id={e.get('id', '?')})")
    
    report["editoras_raw"] = editoras
    
    # Conta quantas vezes "Top Show Music" aparece
    top_show = [e for e in editoras if "top show" in (e.get("nome_fantasia", "") + e.get("nome", "")).lower()]
    report["top_show_count"] = len(top_show)
    log(f"  Top Show Music: {len(top_show)} registro(s)")
    
    # Verifica titulares
    titulares_result = page.evaluate("""async (args) => {
        const { baseUrl, token } = args;
        try {
            const r = await fetch(baseUrl + '/api/titulares?per_page=200&status=ativo', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const body = await r.json();
            return { status: r.status, body: body };
        } catch(e) {
            return { status: -1, error: e.message };
        }
    }""", {"baseUrl": BASE_URL, "token": token})
    
    titulares = titulares_result.get("body", {}).get("data", [])
    report["titulares_count"] = len(titulares)
    log(f"  Titulares ativos: {len(titulares)}")
    if titulares:
        for t in titulares[:5]:
            log(f"    - {t.get('nome_completo', t.get('nome', '?'))}")
    
    # Navega para o wizard
    page.goto(f"{BASE_URL}/master/contratos/novo", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    ss(page, "04_wizard_step1")
    
    # Step 1: Seleciona tipo "Cessão Parcial" (cessao_parcial)
    log("  Step 1: Selecionando tipo 'Cessão Parcial'...")
    try:
        # Clica no botão de tipo cessao_parcial
        cessao_btn = page.locator("button:has-text('Cessão Parcial'), button:has-text('Cessao Parcial')").first
        if cessao_btn.count() > 0:
            cessao_btn.click()
            time.sleep(0.5)
            log("  Tipo 'Cessão Parcial' selecionado")
        else:
            # Tenta pelo texto do tipo
            all_btns = page.locator("button").all()
            for btn in all_btns:
                txt = btn.text_content() or ""
                if "cessão parcial" in txt.lower() or "cessao parcial" in txt.lower():
                    btn.click()
                    time.sleep(0.5)
                    log(f"  Tipo selecionado via texto: {txt[:50]}")
                    break
    except Exception as ex:
        log(f"  ⚠️ Erro ao selecionar tipo: {ex}")
        report["erros"].append(f"Wizard Step1 tipo: {ex}")
    
    # Seleciona editora
    if editoras:
        editora_id = editoras[0].get("id", "")
        editora_nome = editoras[0].get("nome_fantasia", editoras[0].get("nome", ""))
        log(f"  Selecionando editora: {editora_nome}")
        try:
            select_editora = page.locator("select").filter(has_text="editora").first
            if select_editora.count() == 0:
                # Tenta qualquer select
                selects = page.locator("select").all()
                for sel in selects:
                    opts = sel.locator("option").all()
                    for opt in opts:
                        if editora_id in (opt.get_attribute("value") or ""):
                            sel.select_option(value=editora_id)
                            log(f"  Editora selecionada via select")
                            break
        except Exception as ex:
            log(f"  ⚠️ Erro ao selecionar editora: {ex}")
    
    ss(page, "05_wizard_step1_filled")
    
    # Clica Próximo
    try:
        next_btn = page.locator("button:has-text('Próximo'), button:has-text('Proximo'), button:has-text('Next')").first
        if next_btn.count() > 0:
            next_btn.click()
            time.sleep(1)
            log("  Avançou para Step 2")
        else:
            # Tenta botão com ícone ChevronRight
            page.locator("button").filter(has_text="Próximo").click()
            time.sleep(1)
    except Exception as ex:
        log(f"  ⚠️ Erro ao avançar Step1→2: {ex}")
    
    ss(page, "06_wizard_step2")
    
    # Step 2: Modelo Jurídico — seleciona o primeiro disponível
    log("  Step 2: Selecionando modelo jurídico...")
    try:
        modelo_btns = page.locator("button[class*='border']").all()
        if modelo_btns:
            modelo_btns[0].click()
            time.sleep(0.5)
            log("  Modelo selecionado")
    except Exception as ex:
        log(f"  ⚠️ Erro ao selecionar modelo: {ex}")
    
    # Avança
    try:
        page.locator("button:has-text('Próximo'), button:has-text('Proximo')").first.click()
        time.sleep(1)
    except Exception as ex:
        log(f"  ⚠️ Erro ao avançar Step2→3: {ex}")
    
    ss(page, "07_wizard_step3_partes")
    
    # Step 3: Partes — busca titular
    log("  Step 3: Buscando titular...")
    try:
        search_input = page.locator("input[placeholder*='Buscar titular'], input[placeholder*='titular']").first
        if search_input.count() > 0:
            search_input.fill("Autor")
            time.sleep(1)
            ss(page, "08_wizard_step3_busca_titular")
            
            # Verifica resultados
            dropdown = page.locator("div[class*='absolute']").filter(has_text="PF").first
            if dropdown.count() > 0:
                # Clica no primeiro resultado
                dropdown.locator("button").first.click()
                time.sleep(0.5)
                log("  Titular selecionado")
            else:
                log("  Nenhum titular encontrado — banco de titulares vazio ou sem 'Autor'")
                report["erros"].append("Banco de titulares: nenhum resultado para 'Autor'")
        else:
            log("  Campo de busca de titular não encontrado")
    except Exception as ex:
        log(f"  ⚠️ Erro no Step3 partes: {ex}")
    
    # Avança Steps 3→4→5→6→7→8
    for step_num in range(3, 9):
        try:
            next_btn = page.locator("button:has-text('Próximo'), button:has-text('Proximo')").first
            if next_btn.count() > 0:
                next_btn.click()
                time.sleep(0.8)
                log(f"  Avançou para Step {step_num + 1}")
            else:
                log(f"  Botão Próximo não encontrado no Step {step_num}")
                break
        except Exception as ex:
            log(f"  ⚠️ Erro ao avançar Step{step_num}→{step_num+1}: {ex}")
            break
        
        if step_num == 5:  # Step 6: Período
            try:
                # Vigência início
                date_inputs = page.locator("input[type='date']").all()
                if date_inputs:
                    date_inputs[0].fill("2026-01-01")
                    log("  Vigência início: 2026-01-01")
                
                # Prazo indeterminado
                checkbox = page.locator("input[type='checkbox']").first
                if checkbox.count() > 0:
                    if not checkbox.is_checked():
                        checkbox.click()
                    log("  Prazo indeterminado marcado")
            except Exception as ex:
                log(f"  ⚠️ Erro ao preencher período: {ex}")
            ss(page, f"09_wizard_step{step_num+1}_periodo")
    
    ss(page, "10_wizard_step9_revisao")
    
    # Step 9: Revisão — clica "Criar Contrato"
    log("  Step 9: Clicando 'Criar Contrato'...")
    
    # Intercepta a requisição de rede
    network_log = []
    
    def on_response(response):
        if "/api/contratos" in response.url and response.request.method == "POST":
            try:
                body = response.json()
            except:
                body = None
            network_log.append({
                "url": response.url,
                "method": response.request.method,
                "status": response.status,
                "body": body,
            })
    
    page.on("response", on_response)
    
    try:
        criar_btn = page.locator("button:has-text('Criar Contrato'), button:has-text('Criar contrato'), button:has-text('Finalizar'), button:has-text('Salvar')").first
        if criar_btn.count() > 0:
            criar_btn.click()
            time.sleep(3)
            log("  Botão 'Criar Contrato' clicado")
        else:
            log("  ⚠️ Botão 'Criar Contrato' não encontrado")
            report["erros"].append("Botão 'Criar Contrato' não encontrado no Step 9")
    except Exception as ex:
        log(f"  ⚠️ Erro ao clicar 'Criar Contrato': {ex}")
        report["erros"].append(f"Erro ao clicar Criar Contrato: {ex}")
    
    ss(page, "11_wizard_after_submit")
    
    if network_log:
        log(f"  Network interceptado: {len(network_log)} chamada(s) POST /api/contratos")
        for nl in network_log:
            log(f"    HTTP {nl['status']} — {nl['url']}")
            log(f"    Body: {json.dumps(nl.get('body', {}), ensure_ascii=False)[:300]}")
        report["wizard_network"] = network_log
        
        # Verifica status do contrato criado
        for nl in network_log:
            if nl["status"] == 201:
                data = nl.get("body", {}).get("data", {})
                report["contrato_status"] = data.get("status")
                report["contrato_criado_id"] = data.get("id")
                log(f"  ✅ Contrato criado! Status: {data.get('status')}, ID: {data.get('id')}")
            elif nl["status"] == 500:
                err = nl.get("body", {}).get("error", "")
                log(f"  ❌ Erro 500: {err}")
                report["erros"].append(f"Wizard POST 500: {err}")
    else:
        log("  ⚠️ Nenhuma chamada POST /api/contratos interceptada")
        report["erros"].append("Nenhuma chamada POST /api/contratos detectada no wizard")

def etapa3_listagem_pos_criacao(page: Page):
    log("=== ETAPA 3: Listagem após criação ===")
    page.goto(f"{BASE_URL}/master/contratos", wait_until="networkidle", timeout=30000)
    time.sleep(3)
    ss(page, "12_contratos_listagem_pos_criacao")
    
    # Captura KPIs visíveis
    content = page.content()
    
    # Tenta extrair números dos KPI cards
    kpi_text = page.locator("[class*='kpi'], [class*='KPI'], [class*='card']").all_text_contents()
    log(f"  KPI cards text: {kpi_text[:5]}")
    
    # Conta contratos listados
    contrato_rows = page.locator("a[href*='/master/contratos/']").all()
    log(f"  Contratos na listagem: {len(contrato_rows)}")
    
    for row in contrato_rows[:10]:
        txt = row.text_content() or ""
        report["contratos_listagem"].append(txt[:100])
        log(f"    - {txt[:80]}")

def etapa4_api_direta(page: Page):
    log("=== ETAPA 4: Verificar API diretamente ===")
    token = get_token(page)
    
    result = page.evaluate("""async (args) => {
        const { baseUrl, token } = args;
        try {
            const r = await fetch(baseUrl + '/api/contratos?per_page=100', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const body = await r.json();
            return { status: r.status, body: body };
        } catch(e) {
            return { status: -1, error: e.message };
        }
    }""", {"baseUrl": BASE_URL, "token": token})
    
    log(f"  GET /api/contratos → HTTP {result.get('status')}")
    body = result.get("body", {})
    
    kpis = body.get("kpis", {})
    contratos = body.get("data", [])
    total = body.get("total", 0)
    
    log(f"  Total contratos: {total}")
    log(f"  KPIs: {json.dumps(kpis, ensure_ascii=False)}")
    
    report["kpi_em_vigor"] = kpis.get("em_vigor")
    report["kpi_total"] = kpis.get("total")
    report["kpis_raw"] = kpis
    report["api_contratos_raw"] = {
        "total": total,
        "kpis": kpis,
        "contratos": [{"id": c.get("id"), "numero": c.get("numero"), "status": c.get("status"), "tipo": c.get("tipo")} for c in contratos[:20]]
    }
    
    for c in contratos[:10]:
        log(f"    - {c.get('numero', '?')} | status={c.get('status')} | tipo={c.get('tipo')}")

def etapa5_bridge_analitica(page: Page):
    log("=== ETAPA 5: Bridge Analítica ===")
    page.goto(f"{BASE_URL}/master/obras", wait_until="networkidle", timeout=30000)
    time.sleep(2)
    ss(page, "13_obras_listagem")
    
    # Verifica se há obras
    content = page.content()
    obra_links = page.locator("a[href*='/master/obras/']").all()
    log(f"  Obras encontradas: {len(obra_links)}")
    
    if len(obra_links) == 0:
        report["bridge_obras"] = "VAZIO"
        log("  Banco de obras vazio — pulando bridge analítica")
        return
    
    report["bridge_obras"] = f"{len(obra_links)} obras"
    
    # Abre a primeira obra
    try:
        obra_links[0].click()
        page.wait_for_load_state("networkidle", timeout=15000)
        time.sleep(2)
        ss(page, "14_obra_detalhe")
        
        # Procura botão "Analítico"
        analitico_btn = page.locator("button:has-text('Analítico'), button:has-text('Analitico'), a:has-text('Analítico')").first
        if analitico_btn.count() > 0:
            analitico_btn.click()
            time.sleep(2)
            ss(page, "15_obra_analitico")
            
            analitico_content = page.content()
            report["bridge_result"] = "Analítico aberto — ver screenshot 15_obra_analitico"
            log("  Bridge analítica: botão encontrado e clicado")
        else:
            log("  Botão 'Analítico' não encontrado na obra")
            report["bridge_result"] = "Botão Analítico não encontrado"
    except Exception as ex:
        log(f"  ⚠️ Erro na bridge analítica: {ex}")
        report["bridge_result"] = f"Erro: {ex}"

def main():
    log("Iniciando validação do módulo de contratos (migration 022)")
    log(f"Screenshots em: {SCREENSHOTS_DIR}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="pt-BR",
        )
        page = context.new_page()
        
        try:
            login(page)
            etapa0_migration(page)
            etapa1_listagem_existente(page)
            etapa2_wizard(page)
            etapa3_listagem_pos_criacao(page)
            etapa4_api_direta(page)
            etapa5_bridge_analitica(page)
        except Exception as ex:
            log(f"ERRO FATAL: {ex}")
            report["erros"].append(f"ERRO FATAL: {ex}")
            ss(page, "99_erro_fatal")
        finally:
            browser.close()
    
    # Salva relatório JSON
    report_path = os.path.join(SCREENSHOTS_DIR, "relatorio_022.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    log(f"\nRelatório salvo em: {report_path}")
    log("\n" + "="*60)
    log("RESUMO FINAL")
    log("="*60)
    log(f"Migration 022:        {report['migration_022']}")
    log(f"POST status HTTP:     {report['post_status']}")
    log(f"Status contrato:      {report['contrato_status']}")
    log(f"Top Show Music count: {report['top_show_count']}")
    log(f"KPI Em Vigor:         {report['kpi_em_vigor']}")
    log(f"KPI Total:            {report['kpi_total']}")
    log(f"Bridge obras:         {report['bridge_obras']}")
    log(f"Bridge result:        {report['bridge_result']}")
    log(f"Erros:                {len(report['erros'])}")
    for e in report["erros"]:
        log(f"  - {e}")
    log(f"Screenshots:          {len(report['screenshots'])}")
    for s in report["screenshots"]:
        log(f"  - {s}")
    
    return report

if __name__ == "__main__":
    main()
