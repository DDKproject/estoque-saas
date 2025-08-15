# Controle de Estoque (SaaS – MVP)

Aplicação **100% gratuita** (Front estático + Supabase) para controlar produtos e movimentações de estoque.  
Sem back-end próprio: o front consome diretamente o Supabase com **RLS**.

## 🚀 Funcionalidades
- Cadastro de produtos (nome, SKU, custo, preço, mínimo).
- Entradas/Saídas de estoque com observação.
- Estoque atual calculado automaticamente (view `v_product_stock`).
- Alerta de **estoque baixo** na Dashboard.
- Autenticação por **Magic Link** (Supabase Auth).
- Multi-workspace simples (uma por negócio) com base em RLS.

## 🛠 Stack
- **HTML/CSS/JS** (sem build)
- **Supabase** (Postgres + Auth + RLS)
- **Cloudflare Pages** (hospedagem grátis)

## 📦 Como rodar
1. Crie um projeto no **Supabase** e copie **Project URL** e **Anon Key** (Settings → API).
2. No Supabase, abra **SQL Editor** e execute o script do arquivo `docs/schema.sql`.
3. Edite `js/config.js`:
```js
export const SUPABASE_URL = "https://SEU-PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "SUA-ANON-KEY";
