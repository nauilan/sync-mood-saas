# REGRAS DE NEGÓCIO — SYNC MOOD
> Documento gerado em 2026-05-23. Fonte: definições do usuário Master ao longo do desenvolvimento.

---

## 1. ARQUITETURA MULTI-TENANT: EDITORA ADMINISTRADORA (AM) × EDITORAS ADMINISTRADAS (E)

### 1.1 Hierarquia
- O sistema possui **uma Editora Administradora (AM)** — a editora Master do sistema (ex: Top Show Music).
- A AM pode cadastrar **N Editoras Administradas (E)**, cada uma com seu próprio catálogo.
- **A AM manda em tudo.** Ela tem acesso total ao sistema sem restrições.

### 1.2 Catálogo Unificado
- Toda obra cadastrada por uma Editora Administrada (E) compõe **automaticamente** o catálogo da AM por força do contrato de administração.
- A lógica de links de participação segue o padrão:

```
Link 1 → Autor 1
Link 1 → Editora Original (E)        ← editora que cadastrou a obra
Link 1 → Editora Administradora (AM) ← incluída automaticamente
```

### 1.3 Autorizações e Licenciamentos
- **REGRA INVIOLÁVEL:** Toda autorização e licenciamento de obras do catálogo de qualquer Editora Administrada é emitido e autorizado **exclusivamente pela AM**.
- A Editora Administrada **não pode** emitir autorizações ou licenciamentos por conta própria.
- **OBRIGATÓRIO em autorizações e licenciamentos:** incluir a **letra da obra** no documento.

### 1.4 Financeiro
- A Editora Administrada tem acesso **somente** ao financeiro de autores e obras do **seu próprio catálogo**.
- Receitas, demonstrativos e prestações de outras editoras são invisíveis para ela.

### 1.5 Contratos
- Cada Editora Administrada pode gerar seus próprios contratos com titulares do seu catálogo **desde que o módulo esteja habilitado pela AM**.
- Contratos gerados pela E ficam visíveis também para a AM.

---

## 2. CONTROLE DE ACESSO POR USUÁRIO

### 2.1 Identificação via CPF
- O acesso ao sistema é feito por vínculo ao **CPF do usuário** — o CPF é o identificador principal de login.

### 2.2 Acesso Multi-Editora
- O usuário Master da AM pode conceder a um colaborador acesso a **uma ou mais Editoras Administradas**.
- O mesmo colaborador pode, com um único CPF, operar na Editora Master **e** nas Editoras Administradas às quais tem acesso.
- O acesso à Editora Master é automático para qualquer usuário cadastrado pela AM (conforme perfil).
- O acesso às Editoras Administradas é **concedido individualmente** pelo usuário Master, editora por editora.

### 2.3 Módulos por Editora Administrada
- O usuário Master da AM habilita individualmente quais módulos cada Editora Administrada pode acessar.
- Módulos disponíveis para habilitação:

| Grupo        | Módulo                  | Descrição |
|--------------|-------------------------|-----------|
| Cadastros    | Titulares               | Cadastro e gestão de titulares do catálogo próprio |
| Cadastros    | Obras                   | Visualização das obras do catálogo próprio |
| Cadastros    | Cadastro de Obra        | Registrar novas obras (gera link AM automaticamente) |
| Contratos    | Contratos               | Visualizar contratos vinculados ao seu catálogo |
| Contratos    | Novo Contrato           | Gerar contratos com titulares do seu catálogo |
| Autorizações | Autorizações (leitura)  | Ver autorizações emitidas — licenciamento sempre pela AM |
| Financeiro   | Financeiro              | Recebimentos, CC e demonstrativos do próprio catálogo |
| Financeiro   | Prestação de Contas     | Ver prestações referentes ao seu catálogo |
| Relatórios   | Relatórios              | Relatórios restritos ao catálogo próprio |
| Admin        | Usuários                | Gerenciar usuários internos da editora administrada |

---

## 3. IDENTIFICADORES — CÓDIGOS ALFANUMÉRICOS SEQUENCIAIS

### 3.1 Obras
- Formato: `TSM00001`, `TSM00002`, … (prefixo TSM + 5 dígitos com zeros à esquerda)
- Geração automática sequencial crescente com base no maior código existente (mocks + localStorage)
- **Códigos podem ser editados manualmente.** O sistema detecta o maior código existente e gera o próximo a partir dele.

### 3.2 Titulares / Autores
- Formato: `00001 TSM` (5 dígitos + sufixo TSM)
- Mesma lógica de geração sequencial crescente

### 3.3 Contratos
- Formato: `CTR-00001`, `CTR-00002`, … (prefixo CTR + 5 dígitos)
- ID crescente, único para todos os tipos de contrato

### 3.4 Autorizações e Licenciamentos
- Devem ter ID próprio crescente (formato a definir, ex: `AUT-00001`, `LIC-00001`)

### 3.5 Regra de sequência após edição manual
- Se um código for alterado manualmente (ex: obra TSM00010 → TSM00050), o próximo código gerado automaticamente será TSM00051.
- O sistema sempre busca o **maior número existente** entre todos os registros para calcular o próximo.

---

## 4. OBRAS — CADASTRO E VALIDAÇÃO

### 4.1 Wizard de Nova Obra (6 passos)
```
1. Título & Gênero
2. Links & Participação
3. Fonogramas
4. Letra
5. Contrato Assinado   ← OBRIGATÓRIO para validar o cadastro
6. Revisão
```

### 4.2 Contrato Obrigatório
- O upload do contrato assinado (PDF) é **obrigatório** para que o cadastro da obra seja finalizado.
- Sem contrato, o cadastro não pode ser salvo (pré-cadastro foi removido do sistema).

### 4.3 Titular no Contrato
- O usuário deve **buscar o titular no banco de dados** pelo nome ou CPF/CNPJ.
- Se o titular **não for encontrado**, deve haver opção de **cadastrar um novo titular** diretamente nessa tela, sem sair do fluxo.

### 4.4 Tipo de Contrato
- `Cessão de Obras` (antigo "Cessão Parcial") — contrato padrão de cessão
- Outros tipos ativos: Licenciamento, Adm. Editorial, Coeditorial, Subedição, Cessão Internacional, Obra Nova, Versionamento
- ~~Cessão Total~~ — **excluído do sistema**

### 4.5 Letra da Obra
- A letra é **opcional** no cadastro manual.
- Uma IA deve ler o contrato assinado e buscar as letras das obras mencionadas no contrato automaticamente.

### 4.6 Navegação no Stepper
- Passos já preenchidos/validados: **clicáveis** (navegar livremente)
- Passos não alcançados: **desabilitados** (cursor not-allowed, sem onClick)
- Ao voltar: dados preenchidos são preservados
- Ao avançar para passo não alcançado sem validação: bloqueado

### 4.7 Fonogramas
- Fonogramas são exibidos como **sub-informação dentro das obras** (não como seção independente nas telas de listagem de catálogo de editoras).

---

## 5. TITULARES

### 5.1 Drawer de Detalhe
- Ao clicar em um titular na listagem, abre um **drawer lateral** (sem mudar de tela) com todas as informações cadastrais.
- O drawer tem abas: Dados Cadastrais | Contatos | Funções | **Obras/Contratos**

### 5.2 Aba Obras/Contratos no Drawer
- Sub-tab **Contratos Assinados**: número CTR, tipo, vigência, status badge, papel/percentual do titular, chips de obras vinculadas
- Sub-tab **Obras Vinculadas**: código TSM, título, papel, percentual, status

### 5.3 Busca de Titular
- Em qualquer tela que referencie um titular (contratos, obras), o campo deve ser uma **busca por nome/CPF**.
- Se não encontrar: exibir opção **"Cadastrar novo titular"** inline, sem sair do fluxo.

---

## 6. AUTORIZAÇÕES E LICENCIAMENTOS

### 6.1 Regra de Letra
- **IMPRESCINDÍVEL:** toda autorização e licenciamento deve incluir a **letra da obra** autorizada/licenciada.

### 6.2 Emissão
- Somente a AM pode emitir autorizações e licenciamentos, inclusive para obras de Editoras Administradas.

---

## 7. OBRAS — VISUALIZAÇÃO

### 7.1 Abertura de Obra
- Ao clicar em uma obra na listagem, deve abrir um **modal/drawer na frente da tela principal** com todas as informações da obra.
- **Não deve mudar de rota/tela.**

---

## 8. CONTRATOS — TIPOS ATIVOS

| Código interno         | Nome exibido           |
|------------------------|------------------------|
| `cessao_parcial`       | Cessão de Obras        |
| `licenciamento`        | Licenciamento          |
| `administracao_editorial` | Adm. Editorial      |
| `coeditorial`          | Coeditorial            |
| `subedicao`            | Subedição              |
| `cessao_internacional` | Cessão Internacional   |
| `obra_nova`            | Obra Nova              |
| `versionamento`        | Versionamento          |
| ~~`cessao_total`~~     | ~~Cessão Total~~       |

---

_Última atualização: 2026-05-23_
_Este arquivo deve ser atualizado sempre que novas regras forem definidas._
