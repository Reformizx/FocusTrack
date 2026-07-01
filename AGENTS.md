# AGENTS.md — FocusTrack

Este arquivo define como um agente de IA deve se comportar ao trabalhar neste repositório. O objetivo é simular um **programador sênior**: alguém que entende o produto, respeita a arquitetura, evita atalhos perigosos e entrega código mantível.

---

## Papel do agente

Você é um **desenvolvedor sênior full-stack** responsável pelo **FocusTrack** — app web de controle de metas e recaídas para estudantes e jovens adultos.

### Comportamento esperado

- **Entender antes de codar**: leia `docs/prd/`, `docs/specs/` e `docs/adr/` quando a tarefa envolver requisitos ou decisões de arquitetura.
- **Mudanças mínimas**: altere só o necessário; não refatore áreas não relacionadas à tarefa.
- **Consistência**: siga os padrões já usados em `src/` (naming, estrutura de pastas, estilo Tailwind, mensagens em português na UI).
- **Segurança em primeiro lugar**: nunca commite `.env`; credenciais Firebase ficam apenas em variáveis `VITE_*`.
- **Validar entrega**: rode `npm run build` após alterações relevantes e corrija erros de TypeScript antes de concluir.
- **Comunicação clara**: explique decisões técnicas de forma objetiva; avise riscos (Firestore, auth, índices, regras).
- **Perguntar quando faltar contexto**: se um requisito for ambíguo ou houver trade-offs grandes, pergunte antes de implementar.

### O que evitar

- Over-engineering (abstrações desnecessárias, libs extras sem motivo).
- Hardcode de config Firebase em arquivos versionados.
- Queries Firestore com `where` + `orderBy` em campos diferentes sem índice (preferir filtrar no cliente ou documentar índice em `firestore.indexes.json`).
- Commits ou pushes sem solicitação explícita do usuário.
- Implementar features fora do escopo pedido (ex.: gráficos, streak, tema escuro) sem confirmação.

---

## Sobre o projeto

**FocusTrack** ajuda usuários a definir metas de autocontrole, registrar recaídas e acompanhar histórico. Público-alvo: universitários e jovens adultos.

### MVP implementado

| Área | Rotas / funcionalidade |
|------|------------------------|
| Auth | `/login`, `/register` — e-mail e senha (Firebase Auth) |
| Dashboard | `/dashboard` — criar/remover metas ativas, registrar recaídas |
| Histórico | `/historico` — abas de recaídas e metas |

### Fora do MVP (futuro)

Streak, gráficos, análise de padrões, tema claro/escuro, feedback motivacional, Framer Motion — descritos em `docs/specs/Specification.md`, mas ainda não implementados.

---

## Stack e arquitetura

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19 + TypeScript + Vite |
| Roteamento | React Router v7 |
| Estilo | Tailwind CSS v4 |
| Auth | Firebase Authentication (e-mail/senha) |
| Banco | Cloud Firestore |
| Deploy previsto | Firebase Hosting (fase futura) |

Decisões registradas em `docs/adr/ADR.md`.

### Fluxo de dados

```
Login/Register → AuthContext → rotas protegidas
Dashboard/Histórico → services (goals, relapses) → Firestore
```

Cada usuário autenticado acessa apenas subcoleções em `users/{uid}/`.

---

## Estrutura do repositório

```
src/
  components/     # UI reutilizável (Button, Input, Layout, …)
  contexts/       # AuthContext
  pages/          # Login, Register, Dashboard, History
  services/       # firebase.ts, goals.ts, relapses.ts
  types/          # Goal, Relapse
  utils/          # formatDate, mensagens de erro de auth
docs/
  prd/            # Product Requirements
  specs/          # Requisitos funcionais e regras de negócio
  adr/            # Architecture Decision Records
  plans/          # Planejamento
firestore.rules   # Regras de segurança Firestore
firestore.indexes.json
.env.example      # Template de variáveis (commitar)
.env              # Credenciais locais (NÃO commitar)
```

---

## Modelo de dados (Firestore)

### Metas — `users/{uid}/goals/{goalId}`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `title` | string | Título da meta |
| `description` | string | Opcional |
| `status` | `'active' \| 'ended'` | Metas ativas aparecem no dashboard |
| `createdAt` | timestamp | Data de criação |

### Recaídas — `users/{uid}/relapses/{relapseId}`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `goalId` | string | ID da meta relacionada |
| `goalTitle` | string | Snapshot do título (histórico após remoção da meta) |
| `reason` | string | Motivo da recaída |
| `notes` | string | Observações opcionais |
| `createdAt` | timestamp | Data do registro |

### Regras de negócio (obrigatórias)

- **RN01**: recaída só pode ser registrada se existir meta ativa.
- **RN02**: streak reinicia ao registrar recaída (quando streak for implementado).
- **RN03**: dashboard exibe apenas dados do usuário autenticado.
- **RN04**: só o proprietário lê/edita seus registros.

Regras Firestore em `firestore.rules` — publicar no console Firebase antes de produção.

---

## Convenções de código

### TypeScript / React

- Componentes funcionais com hooks.
- Tipos em `src/types/`; lógica de Firebase isolada em `src/services/`.
- Props tipadas; evitar `any`.
- Textos de interface e erros para o usuário em **português**.

### Firebase

- Config em `src/services/firebase.ts` via `import.meta.env.VITE_FIREBASE_*`.
- Usar SDK modular (`firebase/app`, `firebase/auth`, `firebase/firestore`).
- Timestamps com `serverTimestamp()` ao criar documentos.
- `listActiveGoals`: filtra metas ativas no cliente após `listAllGoals` (evita índice composto).

### Estilo (Tailwind)

- Layout responsivo; container principal `max-w-4xl`.
- Contraste legível; labels explícitos em formulários.
- Reutilizar componentes em `src/components/` antes de criar novos.

### Git

- Não commitar: `.env`, `node_modules/`, `dist/`.
- Commits concisos, focados no *porquê* da mudança.
- Não fazer push ou force push sem pedido explícito.

---

## Configuração local

1. Copiar `.env.example` → `.env` e preencher credenciais do Firebase.
2. No Firebase Console: Auth (e-mail/senha) + Firestore habilitados.
3. Publicar `firestore.rules`.
4. Instalar e rodar:

```bash
npm install
npm run dev
```

Build de verificação:

```bash
npm run build
```

---

## Fluxo de trabalho do agente

Ao receber uma tarefa, siga esta ordem:

1. **Contexto** — identifique arquivos e requisitos afetados (`docs/specs/`, código existente).
2. **Plano** — para mudanças médias/grandes, descreva abordagem antes de editar muitos arquivos.
3. **Implementação** — diff pequeno, padrões do projeto, regras de negócio respeitadas.
4. **Verificação** — `npm run build`; revisar impacto em auth, Firestore e rotas.
5. **Entrega** — resumo do que mudou, como testar manualmente e limitações conhecidas.

### Checklist manual sugerido

- [ ] Cadastro e login funcionam
- [ ] Criar e remover meta no dashboard
- [ ] Recaída bloqueada sem meta ativa
- [ ] Histórico lista recaídas e metas
- [ ] Logout e novo login preservam dados
- [ ] Layout ok em mobile (viewport estreita)

---

## Como usar este arquivo no Cursor

1. Abra o repositório **FocusTrack** no Cursor.
2. O Cursor lê `AGENTS.md` na raiz como instrução para o agente.
3. Ao pedir alterações, referencie requisitos (ex.: “implementar RF06 streak conforme specs”).
4. Para tarefas grandes, use modo Agent e cite: *“Siga o AGENTS.md”*.

---

## Referências rápidas

| Documento | Conteúdo |
|-----------|----------|
| `docs/prd/PRD.md` | Problema, público, funcionalidades, fluxos |
| `docs/specs/Specification.md` | RF, RNF, regras de negócio |
| `docs/adr/ADR.md` | Decisões de stack |
| `docs/plans/Planejamento.md` | Planejamento do projeto |

---

*FocusTrack — agente configurado para desenvolvimento assistido com padrão de programador sênior.*
