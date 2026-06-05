# -*- coding: utf-8 -*-
"""
Validacao FINAL do modulo de contratos apos migration 022
Checklist completo conforme especificacao
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

report = {
    "timestamp": datetime.now().isoformat(),
    "migration_022_status": None,
    "login_ok": False,
    # Wizard
    "wizard_step1_tipo": None,
    "wizard_step1_editora": None,
    "wizard_top_show_duplicata": None,
    "wizard_titular_busca_ok": False,
    "wizard_titular_encontrado": None,
    "wizard_post_status": None,
    "wizard_post_body": None,
    "wizard_contrato_id": None,
    "wizard_contrato_status": None,
    "wizard_contrato_data_inicio": None,
    "wizard_save_error": None,
    # Listagem
    "listagem_total_visiveis": 0,
    "listagem_status_recente": None,
    "listagem_kpi_em_vigor": None,
    # API direta
    "api_total_contratos": None,
    "api_kpis": None,
    "api_statuses": [],
    # Bridge
    "bridge_obras_total": None,
    "bridge_analitico_status": None,
    "bridge_analitico_response": None,
    # Erros
    "erros": [],
    "screenshots": [],
}

def log(msg):
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")
    except UnicodeEncodeError:
        safe = msg.encode('ascii', errors='replace').decode('ascii')
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {safe}")

def ss(page: Page, name: str) -> str:
    path = os.path.join(SCREENSHOTS_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    report["screenshots"].append(path)
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

def api_call(page: Page, method: str, path: str, token: str, body: dict = None) -> dict:
    return page.evaluate("""async (args) => {
        const { baseUrl, method, path, token, body } = args;
        try {
            const opts = {
                method: method,
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
            };
            if (body) opts.body = JSON.stringify(body);
            const r = await fetch(baseUrl + path, opts);
            let respBody;
            try { respBody = await r.json(); } catch(e) { respBody = null; }
            return { status: r.status, body: respBody };
        } catch(e) {
            return { status: -1, error: e.message };
        }
    }""", {"baseUrl": BASE_URL, "method": method, "path": path, "token": token, "body": body})

def step1_login(page: Page):
    log("=== STEP 1: Login ===")
    page.goto(f"{BASE_URL}/auth/login", wait_until="networkidle", timeout=30000)
    time.sleep(1)

    cpf_input = page.locator("input[type='text'], input[placeholder*='CPF'], input[name*='cpf'], input[id*='cpf']").first
    cpf_input.fill(CPF)
    page.locator("input[type='password']").first.fill(SENHA)
    page.locator("button[type='submit'], button:has-text('Entrar'), button:has-text('Login')").first.click()
    page.wait_for_url(f"{BASE_URL}/master/**", timeout=20000)
    time.sleep(2)
    ss(page, "01_dashboard")
    report["login_ok"] = True
    log(f"  Login OK — URL: {page.url}")

def step2_wizard(page: Page):
    log("=== STEP 2: Wizard de Contrato ===")
    token = get_token(page)
    log(f"  Token: {'OK' if token else 'FALHOU'}")

    # Verifica editoras
    ed_r = api_call(page, "GET", "/api/editoras", token)
    editoras = ed_r.get("body", {}).get("editoras", [])
    top_show = [e for e in editoras if "top show" in (e.get("nome_fantasia","") + e.get("nome","")).lower()]
    report["wizard_top_show_duplicata"] = len(top_show) > 1
    log(f"  Editoras: {len(editoras)} | Top Show Music: {len(top_show)} registro(s)")

    # Verifica titulares
    tit_r = api_call(page, "GET", "/api/titulares?per_page=200&q=Autor", token)
    titulares = tit_r.get("body", {}).get("data", [])
    log(f"  Titulares com 'Autor': {len(titulares)}")
    if titulares:
        report["wizard_titular_encontrado"] = titulares[0].get("nome_completo", titulares[0].get("nome", "?"))
        log(f"  Primeiro titular: {report['wizard_titular_encontrado']}")

    # Navega para o wizard
    page.goto(f"{BASE_URL}/master/contratos/novo", wait_until="networkidle", timeout=30000)
    time.sleep(2)

    # ── Step 1: Tipo & Editora ──
    log("  [Step 1] Tipo & Editora")
    tipo_selecionado = None
    try:
        # Tenta clicar em "Cessão de Direitos" ou primeiro tipo disponível
        btns = page.locator("button").all()
        for btn in btns:
            txt = (btn.text_content() or "").strip()
            if any(k in txt.lower() for k in ["cessão de direitos", "cessao de direitos", "cessão parcial", "cessao parcial"]):
                btn.click()
                tipo_selecionado = txt[:50]
                time.sleep(0.3)
                log(f"  Tipo selecionado: {tipo_selecionado}")
                break
        if not tipo_selecionado:
            # Clica no primeiro botão de tipo (cards de tipo)
            tipo_cards = page.locator("button[class*='border']").all()
            if tipo_cards:
                tipo_cards[0].click()
                tipo_selecionado = (tipo_cards[0].text_content() or "")[:50]
                time.sleep(0.3)
                log(f"  Tipo selecionado (fallback): {tipo_selecionado}")
    except Exception as ex:
        log(f"  ERRO tipo: {ex}")
        report["erros"].append(f"Step1 tipo: {ex}")

    report["wizard_step1_tipo"] = tipo_selecionado

    # Seleciona editora
    editora_selecionada = None
    try:
        selects = page.locator("select").all()
        for sel in selects:
            opts = sel.locator("option").all()
            if len(opts) > 1:
                # Procura Top Show Music
                for opt in opts:
                    val = opt.get_attribute("value") or ""
                    txt = (opt.text_content() or "").lower()
                    if "top show" in txt and val:
                        sel.select_option(value=val)
                        editora_selecionada = "Top Show Music"
                        break
                if not editora_selecionada:
                    sel.select_option(index=1)
                    editora_selecionada = (opts[1].text_content() or "")[:50]
                break
    except Exception as ex:
        log(f"  ERRO editora: {ex}")

    report["wizard_step1_editora"] = editora_selecionada
    log(f"  Editora selecionada: {editora_selecionada}")
    ss(page, "02_step1_tipo_editora")

    # Avança Step 1 → 2
    _next(page, "Step1→2")

    # ── Step 2: Modelo Jurídico ──
    log("  [Step 2] Modelo Jurídico")
    try:
        modelo_cards = page.locator("button[class*='border'], div[class*='cursor-pointer']").all()
        if modelo_cards:
            modelo_cards[0].click()
            time.sleep(0.3)
            log("  Modelo selecionado")
    except Exception as ex:
        log(f"  ERRO modelo: {ex}")
    ss(page, "03_step2_modelo")
    _next(page, "Step2→3")

    # ── Step 3: Partes (Titular) ──
    log("  [Step 3] Partes / Titular")
    ss(page, "04_step3_titular_antes")
    try:
        search_input = page.locator("input[placeholder*='uscar'], input[placeholder*='itular'], input[placeholder*='ome']").first
        if search_input.count() > 0:
            search_input.fill("Autor")
            time.sleep(1.5)
            ss(page, "04_step3_titular")

            # Verifica dropdown
            dropdown_items = page.locator("div[class*='absolute'] button, ul li button, [role='option']").all()
            log(f"  Dropdown items: {len(dropdown_items)}")
            if dropdown_items:
                item_txt = (dropdown_items[0].text_content() or "")[:80]
                dropdown_items[0].click()
                time.sleep(0.5)
                report["wizard_titular_busca_ok"] = True
                log(f"  Titular selecionado: {item_txt}")
            else:
                log("  Nenhum resultado no dropdown")
                report["erros"].append("Busca titular 'Autor': dropdown vazio")
        else:
            log("  Campo busca titular não encontrado")
            report["erros"].append("Campo busca titular não encontrado no Step 3")
    except Exception as ex:
        log(f"  ERRO Step3: {ex}")
        report["erros"].append(f"Step3 titular: {ex}")

    _next(page, "Step3→4")

    # ── Step 4: Direitos ──
    log("  [Step 4] Direitos (padrão)")
    ss(page, "05_step4_direitos")
    _next(page, "Step4→5")

    # ── Step 5: Obras ──
    log("  [Step 5] Obras (pular)")
    ss(page, "06_step5_obras")
    _next(page, "Step5→6")

    # ── Step 6: Período ──
    log("  [Step 6] Período")
    try:
        date_inputs = page.locator("input[type='date']").all()
        if date_inputs:
            date_inputs[0].fill("2026-01-01")
            log("  Data início: 2026-01-01")
        checkbox = page.locator("input[type='checkbox']").first
        if checkbox.count() > 0 and not checkbox.is_checked():
            checkbox.click()
            log("  Prazo indeterminado: marcado")
        # Território BR
        terr_sel = page.locator("select").filter(has_text="BR").first
        if terr_sel.count() > 0:
            terr_sel.select_option(value="BR")
            log("  Território: BR")
    except Exception as ex:
        log(f"  ERRO Step6: {ex}")
    ss(page, "07_step6_periodo")
    _next(page, "Step6→7")

    # ── Step 7: Recoupment ──
    log("  [Step 7] Recoupment (sem adiantamento)")
    _next(page, "Step7→8")

    # ── Step 8: Assinatura ──
    log("  [Step 8] Assinatura")
    try:
        prov_btns = page.locator("button[class*='border']").all()
        if prov_btns:
            prov_btns[0].click()
            time.sleep(0.3)
    except: pass
    _next(page, "Step8→9")

    # ── Step 9: Revisão ──
    log("  [Step 9] Revisão")
    time.sleep(1)
    ss(page, "08_step9_revisao")

    # Intercepta POST
    network_calls = []
    def on_resp(resp):
        if "/api/contratos" in resp.url and resp.request.method == "POST":
            try:
                b = resp.json()
            except:
                b = None
            network_calls.append({"status": resp.status, "url": resp.url, "body": b})
    page.on("response", on_resp)

    # Clica Criar Contrato
    try:
        criar = page.locator("button:has-text('Criar Contrato'), button:has-text('Criar contrato')").first
        if criar.count() > 0:
            criar.click()
            log("  Botão 'Criar Contrato' clicado")
            time.sleep(4)
        else:
            log("  AVISO: Botão 'Criar Contrato' não encontrado")
            report["erros"].append("Botão 'Criar Contrato' não encontrado no Step 9")
    except Exception as ex:
        log(f"  ERRO clicar Criar: {ex}")
        report["erros"].append(f"Erro clicar Criar Contrato: {ex}")

    ss(page, "09_pos_criar")

    # Captura saveError
    try:
        err_el = page.locator("p.text-rose-400, p[class*='rose'], [class*='error']").first
        if err_el.count() > 0:
            report["wizard_save_error"] = (err_el.text_content() or "")[:200]
            log(f"  saveError: {report['wizard_save_error']}")
    except: pass

    # Processa network calls
    log(f"  Network POST /api/contratos: {len(network_calls)} chamada(s)")
    for nc in network_calls:
        log(f"    HTTP {nc['status']} — {json.dumps(nc.get('body', {}), ensure_ascii=False)[:300]}")
        report["wizard_post_status"] = nc["status"]
        report["wizard_post_body"] = nc.get("body")
        if nc["status"] == 201:
            data = nc.get("body", {}).get("data", {})
            report["wizard_contrato_id"] = data.get("id")
            report["wizard_contrato_status"] = data.get("status")
            report["wizard_contrato_data_inicio"] = data.get("data_inicio")
            log(f"  CONTRATO CRIADO: id={data.get('id')} status={data.get('status')} data_inicio={data.get('data_inicio')}")
        elif nc["status"] == 500:
            err = nc.get("body", {}).get("error", "")
            report["erros"].append(f"POST /api/contratos 500: {err}")

def _next(page: Page, label: str):
    try:
        btn = page.locator("button:has-text('Próximo'), button:has-text('Proximo')").first
        if btn.count() > 0:
            btn.click()
            time.sleep(0.8)
            log(f"  Avançou: {label}")
        else:
            log(f"  AVISO: Botão Próximo não encontrado ({label})")
    except Exception as ex:
        log(f"  ERRO avançar {label}: {ex}")

def step3_listagem(page: Page):
    log("=== STEP 3: Listagem após criação ===")
    page.goto(f"{BASE_URL}/master/contratos", wait_until="networkidle", timeout=30000)
    time.sleep(3)
    ss(page, "10_listagem_contratos")

    # Conta contratos visíveis
    rows = page.locator("a[href*='/master/contratos/']").all()
    report["listagem_total_visiveis"] = len(rows)
    log(f"  Contratos visíveis: {len(rows)}")

    # Captura KPI em vigor
    try:
        kpi_texts = page.locator("[class*='text-emerald'], [class*='green']").all_text_contents()
        log(f"  KPI texts (emerald/green): {kpi_texts[:5]}")
    except: pass

    # Captura status do primeiro contrato
    for row in rows[:5]:
        txt = (row.text_content() or "")[:120]
        log(f"  Contrato: {txt}")
        if not report["listagem_status_recente"]:
            if "assinado" in txt.lower():
                report["listagem_status_recente"] = "assinado"
            elif "ativo" in txt.lower():
                report["listagem_status_recente"] = "ativo"

def step4_api(page: Page):
    log("=== STEP 4: Verificação via API ===")
    token = get_token(page)

    r = api_call(page, "GET", "/api/contratos?per_page=100", token)
    log(f"  GET /api/contratos → HTTP {r.get('status')}")
    body = r.get("body", {})
    kpis = body.get("kpis", {})
    contratos = body.get("data", [])
    total = body.get("total", 0)

    report["api_total_contratos"] = total
    report["api_kpis"] = kpis
    report["api_statuses"] = [c.get("status") for c in contratos]
    report["listagem_kpi_em_vigor"] = kpis.get("em_vigor")

    log(f"  Total: {total} | KPIs: {json.dumps(kpis, ensure_ascii=False)}")
    log(f"  Statuses: {report['api_statuses']}")

    for c in contratos[:10]:
        log(f"    {c.get('numero','?')} | status={c.get('status')} | data_inicio={c.get('data_inicio')} | tipo={c.get('tipo')}")

def step5_bridge(page: Page):
    log("=== STEP 5: Bridge Analítica ===")
    token = get_token(page)

    # Busca obras
    r = api_call(page, "GET", "/api/obras?per_page=10", token)
    obras = r.get("body", {}).get("data", [])
    total_obras = r.get("body", {}).get("total", len(obras))
    report["bridge_obras_total"] = total_obras
    log(f"  Obras no banco: {total_obras}")

    if not obras:
        report["bridge_analitico_status"] = "sem_obras"
        log("  Sem obras — bridge analítica não testável")
        return

    # Testa analítico da primeira obra
    obra_id = obras[0].get("id")
    log(f"  Testando analítico para obra {obra_id}...")
    r2 = api_call(page, "GET", f"/api/obras/{obra_id}/analitico", token)
    report["bridge_analitico_status"] = r2.get("status")
    report["bridge_analitico_response"] = r2.get("body")
    log(f"  GET /api/obras/{obra_id}/analitico → HTTP {r2.get('status')}")
    log(f"  Response: {json.dumps(r2.get('body', {}), ensure_ascii=False)[:400]}")

def step0_check_migration(page: Page):
    log("=== STEP 0: Verificar migration 022 ===")
    token = get_token(page)

    # Testa se enum aceita 'assinado'
    r = api_call(page, "POST", "/api/contratos", token, {
        "numero": f"CTR-PROBE-022-{int(time.time())}",
        "tipo": "cessao",
        "status": "assinado",
        "data_inicio": "2026-01-01",
        "prazo_indeterminado": True,
        "territorio": "BR",
        "titular_id": None,
        "editora_id": None,
    })
    log(f"  POST probe status=assinado → HTTP {r.get('status')}")
    body = r.get("body", {})
    err = body.get("error", "")
    log(f"  Response: {json.dumps(body, ensure_ascii=False)[:200]}")

    if r.get("status") == 201:
        report["migration_022_status"] = "APLICADA"
        log("  Migration 022: APLICADA (enum aceita 'assinado')")
        # Limpa o probe
        probe_id = body.get("data", {}).get("id")
        if probe_id:
            api_call(page, "DELETE", f"/api/contratos/{probe_id}", token)
    elif "assinado" in err or "vigencia_inicio" in err or "enum" in err.lower():
        report["migration_022_status"] = "NAO_APLICADA"
        log(f"  Migration 022: NAO APLICADA — {err}")
        report["erros"].append(f"Migration 022 não aplicada: {err}")
    elif "titular_id" in err or "not-null" in err:
        # Erro de NOT NULL mas não de enum — significa que o enum JÁ aceita 'assinado'
        report["migration_022_status"] = "APLICADA (enum ok, faltou titular_id)"
        log("  Migration 022: APLICADA (enum aceita 'assinado', erro foi NOT NULL de titular_id)")
    else:
        report["migration_022_status"] = f"INCERTO (HTTP {r.get('status')}: {err[:100]})"
        log(f"  Migration 022: INCERTO — {err}")

def main():
    log("=" * 60)
    log("VALIDACAO FINAL — MODULO CONTRATOS — MIGRATION 022")
    log(f"Timestamp: {datetime.now().isoformat()}")
    log("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        context = browser.new_context(viewport={"width": 1440, "height": 900}, locale="pt-BR")
        page = context.new_page()

        try:
            step1_login(page)
            step0_check_migration(page)
            step2_wizard(page)
            step3_listagem(page)
            step4_api(page)
            step5_bridge(page)
        except Exception as ex:
            log(f"ERRO FATAL: {ex}")
            import traceback
            traceback.print_exc()
            report["erros"].append(f"ERRO FATAL: {ex}")
            try:
                ss(page, "99_erro_fatal")
            except: pass
        finally:
            browser.close()

    # Salva relatório
    out = os.path.join(SCREENSHOTS_DIR, "relatorio_final_022.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    log("\n" + "=" * 60)
    log("RESUMO FINAL")
    log("=" * 60)
    log(f"Migration 022:          {report['migration_022_status']}")
    log(f"Login OK:               {report['login_ok']}")
    log(f"Wizard POST status:     {report['wizard_post_status']}")
    log(f"Contrato status:        {report['wizard_contrato_status']}")
    log(f"Contrato data_inicio:   {report['wizard_contrato_data_inicio']}")
    log(f"Titular busca OK:       {report['wizard_titular_busca_ok']}")
    log(f"Titular encontrado:     {report['wizard_titular_encontrado']}")
    log(f"Top Show duplicata:     {report['wizard_top_show_duplicata']}")
    log(f"KPI Em Vigor:           {report['listagem_kpi_em_vigor']}")
    log(f"API total contratos:    {report['api_total_contratos']}")
    log(f"API statuses:           {report['api_statuses']}")
    log(f"Bridge obras:           {report['bridge_obras_total']}")
    log(f"Bridge analitico HTTP:  {report['bridge_analitico_status']}")
    log(f"Erros ({len(report['erros'])}):")
    for e in report["erros"]:
        log(f"  - {e}")
    log(f"Screenshots ({len(report['screenshots'])}):")
    for s in report["screenshots"]:
        log(f"  - {s}")
    log(f"\nRelatorio salvo: {out}")

    return report

if __name__ == "__main__":
    main()
