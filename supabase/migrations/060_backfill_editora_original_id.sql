-- 060_backfill_editora_original_id.sql
-- Saneamento: preenche editora_original_id e editora_administradora_id nos CAs
-- a partir dos participantes E/AM do mesmo obra_link_id.
-- Seguro: usa IF NOT EXISTS implícito (WHERE IS NULL) — só atualiza o que está vazio.

-- 1. editora_original_id: busca E ou SE no mesmo link
UPDATE obras_links_titulares ca
SET    editora_original_id = e.editora_id
FROM   obras_links_titulares e
WHERE  ca.obra_link_id          = e.obra_link_id
  AND  ca.funcao_no_link        = 'CA'
  AND  e.funcao_no_link         IN ('E', 'SE')
  AND  ca.editora_original_id   IS NULL
  AND  e.editora_id             IS NOT NULL;

-- 2. editora_administradora_id: busca AM ou SA no mesmo link
UPDATE obras_links_titulares ca
SET    editora_administradora_id = am.editora_id
FROM   obras_links_titulares am
WHERE  ca.obra_link_id               = am.obra_link_id
  AND  ca.funcao_no_link             = 'CA'
  AND  am.funcao_no_link             IN ('AM', 'SA')
  AND  ca.editora_administradora_id  IS NULL
  AND  am.editora_id                 IS NOT NULL;

-- Verificar resultado:
-- SELECT funcao_no_link, count(*) FILTER (WHERE editora_original_id IS NULL) AS ainda_null,
--        count(*) AS total
-- FROM   obras_links_titulares
-- WHERE  funcao_no_link = 'CA'
-- GROUP BY funcao_no_link;
