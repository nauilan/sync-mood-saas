"""
Validacao do modulo Negocios Editoriais - migration 023
Versao 2: corrige chave 'editoras' vs 'data' na resposta
"""
import asyncio
import json
import os
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = r"C:\Users\Usuário\Desktop\sync-mood-saas\screenshots\neg_editoriais"
BASE_URL = "https://sync-mood-saas.vercel.app"
CPF = "04730581970"
PASSWORD = "admin123"

results = {}

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1400, "height": 900})
        page = await context.new_page()

        # ── ETAPA 1: Login ────────────────────────────────────────────────
        print("\n=== ETAPA 1: Login ===")
        login_resp = await page.request.post(
            f"{BASE_URL}/api/auth/login",
            data=json.dumps({"cpf": CPF, "password": PASSWORD}),
            headers={"Content-Type": "application/json"}
        )
        login_status = login_resp.status
        login_data = await login_resp.json()
        token = login_data.get("access_token", "")
        print(f"Login HTTP: {login_status}")
        print(f"Token OK: {bool(token)}")
        print(f"Role: {login_data.get('role', '')}")
        results["etapa1_login_status"] = login_status
        results["etapa1_token_ok"] = bool(token)
        results["etapa1_role"] = login_data.get("role", "")

        auth_headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # ── ETAPA 2: GET /api/negocios-editoriais ─────────────────────────
        print("\n=== ETAPA 2: GET /api/negocios-editoriais ===")
        neg_resp = await page.request.get(
            f"{BASE_URL}/api/negocios-editoriais",
            headers=auth_headers
        )
        neg_status = neg_resp.status
        neg_data = await neg_resp.json()
        print(f"HTTP Status: {neg_status}")
        print(f"Chaves na resposta: {list(neg_data.keys())}")
        negocios = neg_data.get("negocios", [])
        print(f"Total negocios: {neg_data.get('total', 0)}")
        
        tipo_direito_id_presente = False
        if negocios:
            primeiro = negocios[0]
            tipo_direito_id_presente = "tipo_direito_id" in primeiro
            print(f"tipo_direito_id presente: {tipo_direito_id_presente}")
        else:
            print("Nenhum negocio existente - verificaremos apos POST")
            tipo_direito_id_presente = "verificar_apos_post"
        
        results["etapa2_http_status"] = neg_status
        results["etapa2_tipo_direito_id_presente"] = tipo_direito_id_presente
        results["etapa2_total_negocios"] = neg_data.get("total", 0)

        # ── ETAPA 3: Editoras e tipos de direito ──────────────────────────
        print("\n=== ETAPA 3: IDs de editoras ===")
        
        edit_resp = await page.request.get(
            f"{BASE_URL}/api/editoras",
            headers=auth_headers
        )
        edit_raw = await edit_resp.text()
        print(f"Editoras HTTP: {edit_resp.status}")
        print(f"Editoras resposta raw (primeiros 500): {edit_raw[:500]}")
        
        edit_data = json.loads(edit_raw)
        # A API retorna { editoras: [...] } nao { data: [...] }
        editoras = edit_data.get("editoras", edit_data.get("data", []))
        print(f"Total editoras: {len(editoras)}")
        
        id_p3 = None
        id_top_show = None
        id_lr = None
        
        for e in editoras:
            nome = (e.get("nome_fantasia") or e.get("nome") or "").lower()
            print(f"  Editora: {e.get('nome_fantasia') or e.get('nome')} | ID: {e.get('id')}")
            if "p3" in nome:
                id_p3 = e["id"]
            if "top show" in nome:
                id_top_show = e["id"]
            if "lr" in nome or "l.r" in nome or "l r" in nome:
                id_lr = e["id"]
        
        print(f"\nP3 Editora Musical ID: {id_p3}")
        print(f"Top Show Music ID: {id_top_show}")
        print(f"LR Edicoes ID: {id_lr}")
        
        results["etapa3_id_p3"] = id_p3
        results["etapa3_id_top_show"] = id_top_show
        results["etapa3_id_lr"] = id_lr
        results["etapa3_editoras_total"] = len(editoras)
        results["etapa3_editoras_lista"] = [{"id": e.get("id"), "nome": e.get("nome_fantasia")} for e in editoras]

        # Tipos de direito
        tipos_resp = await page.request.get(
            f"{BASE_URL}/api/tipos-direito",
            headers=auth_headers
        )
        tipos_status = tipos_resp.status
        tipos_data = await tipos_resp.json()
        tipos = tipos_data.get("tipos", [])
        print(f"\nGET /api/tipos-direito HTTP: {tipos_status} | Total: {len(tipos)}")
        for t in tipos:
            print(f"  {t.get('codigo')} | {t.get('nome')} | {t.get('id')}")
        
        results["etapa3_tipos_direito_status"] = tipos_status
        results["etapa3_tipos_direito_total"] = len(tipos)
        results["etapa3_tipos_direito"] = [{"id": t.get("id"), "nome": t.get("nome"), "codigo": t.get("codigo")} for t in tipos]

        # ── ETAPA 4: POST criar negocio de teste ──────────────────────────
        print("\n=== ETAPA 4: POST criar negocio de teste ===")
        
        adm_id = id_p3 or (editoras[0]["id"] if editoras else None)
        admr_id = id_top_show or (editoras[1]["id"] if len(editoras) > 1 else None)
        adm_nome = next((e.get("nome_fantasia") for e in editoras if e.get("id") == adm_id), "P3 Editora Musical") if adm_id else "P3 Editora Musical"
        admr_nome = next((e.get("nome_fantasia") for e in editoras if e.get("id") == admr_id), "Top Show Music") if admr_id else "Top Show Music"
        
        if not adm_id or not admr_id:
            print(f"AVISO: IDs nao encontrados via /api/editoras (total={len(editoras)})")
            print("Tentando buscar editoras via titulares...")
            # Tentar via titulares
            tit_resp = await page.request.get(
                f"{BASE_URL}/api/titulares?tipo=editora",
                headers=auth_headers
            )
            tit_data = await tit_resp.json()
            print(f"Titulares HTTP: {tit_resp.status}")
            print(f"Titulares resposta (primeiros 500): {str(tit_data)[:500]}")
            results["etapa4_error"] = f"IDs de editoras nao encontrados via /api/editoras (total={len(editoras)})"
            negocio_id = None
        else:
            post_payload = {
                "nome": "TESTE-023 P3 -> Top Show Digital BR",
                "editora_administrada_id": adm_id,
                "editora_administrada_nome": adm_nome,
                "editora_administradora_id": admr_id,
                "editora_administradora_nome": admr_nome,
                "percentual_administrada": 60,
                "percentual_administradora": 40,
                "receitas_aplicaveis": ["digital"],
                "abrangencia_tipo": "catalogo_inteiro",
                "territorios": ["brasil"],
                "data_inicio": "2026-01-01",
                "tipo_direito_id": None,
                "observacoes": "Negocio de TESTE para validacao da migration 023. Apagar apos validacao."
            }
            
            post_resp = await page.request.post(
                f"{BASE_URL}/api/negocios-editoriais",
                data=json.dumps(post_payload),
                headers=auth_headers
            )
            post_status = post_resp.status
            post_data = await post_resp.json()
            print(f"HTTP Status: {post_status}")
            
            if post_status == 201:
                negocio_criado = post_data.get("negocio", {})
                negocio_id = negocio_criado.get("id")
                print(f"ID criado: {negocio_id}")
                print(f"tipo_direito_id: {negocio_criado.get('tipo_direito_id')}")
                print(f"percentual_administrada: {negocio_criado.get('percentual_administrada')}")
                print(f"percentual_administradora: {negocio_criado.get('percentual_administradora')}")
                results["etapa4_http_status"] = post_status
                results["etapa4_id_criado"] = negocio_id
                results["etapa4_tipo_direito_id"] = negocio_criado.get("tipo_direito_id")
                results["etapa4_campos"] = {k: negocio_criado.get(k) for k in ["nome","percentual_administrada","percentual_administradora","tipo_direito_id","status"]}
                
                # ── ETAPA 5: PUT ──────────────────────────────────────────
                print("\n=== ETAPA 5: PUT editar negocio ===")
                put_payload = {
                    **post_payload,
                    "percentual_administrada": 65,
                    "percentual_administradora": 35,
                    "observacoes": "TESTE-023 editado - verificar se PUT funciona"
                }
                
                put_resp = await page.request.fetch(
                    f"{BASE_URL}/api/negocios-editoriais/{negocio_id}",
                    method="PUT",
                    data=json.dumps(put_payload),
                    headers=auth_headers
                )
                put_status = put_resp.status
                put_data = await put_resp.json()
                print(f"HTTP Status: {put_status}")
                
                if put_status == 200:
                    neg_editado = put_data.get("negocio", {})
                    print(f"percentual_administrada: {neg_editado.get('percentual_administrada')}")
                    print(f"percentual_administradora: {neg_editado.get('percentual_administradora')}")
                    results["etapa5_http_status"] = put_status
                    results["etapa5_percentual_administrada"] = neg_editado.get("percentual_administrada")
                    results["etapa5_percentual_administradora"] = neg_editado.get("percentual_administradora")
                else:
                    print(f"ERRO PUT: {put_data}")
                    results["etapa5_http_status"] = put_status
                    results["etapa5_error"] = str(put_data)

                # ── ETAPA 6: GET confirmar ────────────────────────────────
                print("\n=== ETAPA 6: GET confirmar edicao ===")
                get2_resp = await page.request.get(
                    f"{BASE_URL}/api/negocios-editoriais",
                    headers=auth_headers
                )
                get2_data = await get2_resp.json()
                negocios2 = get2_data.get("negocios", [])
                
                neg_teste = next((n for n in negocios2 if n.get("id") == negocio_id), None)
                if neg_teste:
                    print(f"Negocio encontrado: SIM")
                    print(f"percentual_administrada: {neg_teste.get('percentual_administrada')}")
                    print(f"percentual_administradora: {neg_teste.get('percentual_administradora')}")
                    print(f"tipo_direito_id presente: {'tipo_direito_id' in neg_teste}")
                    print(f"tipo_direito_id valor: {neg_teste.get('tipo_direito_id')}")
                    results["etapa6_negocio_na_lista"] = True
                    results["etapa6_percentual_administrada"] = neg_teste.get("percentual_administrada")
                    results["etapa6_percentual_administradora"] = neg_teste.get("percentual_administradora")
                    results["etapa6_tipo_direito_id_presente"] = "tipo_direito_id" in neg_teste
                    results["etapa6_tipo_direito_id_valor"] = neg_teste.get("tipo_direito_id")
                    if results["etapa2_tipo_direito_id_presente"] == "verificar_apos_post":
                        results["etapa2_tipo_direito_id_presente"] = "tipo_direito_id" in neg_teste
                else:
                    print("ERRO: Negocio nao encontrado!")
                    results["etapa6_negocio_na_lista"] = False
            else:
                print(f"ERRO POST: {post_data}")
                results["etapa4_http_status"] = post_status
                results["etapa4_error"] = str(post_data)
                negocio_id = None

        # ── ETAPA 8: Interface no browser ─────────────────────────────────
        print("\n=== ETAPA 8: Interface no browser ===")
        
        await page.goto(f"{BASE_URL}/master/negocios-editoriais", wait_until="networkidle", timeout=30000)
        
        if "/login" in page.url or "/auth" in page.url:
            print("Redirecionado para login - fazendo login via UI...")
            try:
                await page.fill('input[type="text"]', CPF)
                await page.fill('input[type="password"]', PASSWORD)
                await page.click('button[type="submit"]')
                await page.wait_for_url("**/master/**", timeout=15000)
                await page.goto(f"{BASE_URL}/master/negocios-editoriais", wait_until="networkidle", timeout=30000)
            except Exception as e:
                print(f"Erro no login UI: {e}")
        
        print(f"URL atual: {page.url}")
        page_title = await page.title()
        print(f"Titulo: {page_title}")
        
        # Verificar conteudo da pagina
        body_text = await page.inner_text("body")
        print(f"Conteudo (primeiros 300 chars): {body_text[:300]}")
        
        # Verificar se ha erros
        has_error = "error" in body_text.lower() or "erro" in body_text.lower()
        print(f"Pagina tem texto de erro: {has_error}")
        
        screenshot1 = os.path.join(SCREENSHOTS_DIR, "01_lista_negocios.png")
        await page.screenshot(path=screenshot1, full_page=True)
        print(f"Screenshot 01 salvo: {screenshot1}")
        results["etapa8_url"] = page.url
        results["etapa8_screenshot1"] = screenshot1
        results["etapa8_page_title"] = page_title
        results["etapa8_carregou_sem_erro"] = not ("500" in body_text or "Internal Server Error" in body_text)
        
        # Tentar clicar em Editar (varios seletores)
        edit_found = False
        for selector in ['button:has-text("Editar")', 'a:has-text("Editar")', '[title="Editar"]', 'button[aria-label*="ditar"]', '.edit-button', '[data-action="edit"]']:
            try:
                btn = await page.query_selector(selector)
                if btn:
                    await btn.click()
                    await page.wait_for_timeout(2000)
                    edit_found = True
                    print(f"Botao Editar encontrado com seletor: {selector}")
                    break
            except:
                pass
        
        screenshot2 = os.path.join(SCREENSHOTS_DIR, "02_form_edicao.png")
        await page.screenshot(path=screenshot2, full_page=True)
        print(f"Screenshot 02 salvo: {screenshot2}")
        results["etapa8_form_edicao_abriu"] = edit_found
        results["etapa8_screenshot2"] = screenshot2

        # ── ETAPA 9: DELETE ───────────────────────────────────────────────
        negocio_id = results.get("etapa4_id_criado")
        if negocio_id:
            print(f"\n=== ETAPA 9: DELETE negocio {negocio_id} ===")
            del_resp = await page.request.fetch(
                f"{BASE_URL}/api/negocios-editoriais/{negocio_id}",
                method="DELETE",
                headers=auth_headers
            )
            del_status = del_resp.status
            del_data = await del_resp.json()
            print(f"HTTP Status: {del_status}")
            print(f"Resposta: {del_data}")
            results["etapa9_http_status"] = del_status
            results["etapa9_ok"] = del_data.get("ok", False)
            
            # Confirmar remocao
            get3_resp = await page.request.get(
                f"{BASE_URL}/api/negocios-editoriais",
                headers=auth_headers
            )
            get3_data = await get3_resp.json()
            negocios3 = get3_data.get("negocios", [])
            ainda_existe = any(n.get("id") == negocio_id for n in negocios3)
            print(f"Negocio ainda existe apos DELETE: {ainda_existe}")
            results["etapa9_negocio_removido"] = not ainda_existe
        else:
            print("ETAPA 9: Pulada - nenhum negocio criado (sem editoras no banco)")
            results["etapa9_http_status"] = "N/A - sem editoras cadastradas"

        await browser.close()

    print("\n" + "="*60)
    print("RESULTADOS FINAIS")
    print("="*60)
    print(json.dumps(results, indent=2, ensure_ascii=False, default=str))
    
    with open(os.path.join(SCREENSHOTS_DIR, "resultados.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)
    print(f"\nResultados salvos em: {os.path.join(SCREENSHOTS_DIR, 'resultados.json')}")

asyncio.run(run())
