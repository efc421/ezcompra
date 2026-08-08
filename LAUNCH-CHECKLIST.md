# EZCOMPRA launch checklist

## 1. Supabase
- Run `supabase-setup.sql` in the Supabase SQL editor.
- Make sure you have one admin user in Supabase Authentication.
- Confirm `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## 2. Add 10 real product recommendations
For every product add:
- A valid Amazon Associates special link (with your tracking tag)
- Product title and facts from Amazon
- Your own/original English and Spanish recommendation copy
- Price/rating only if you are manually checking it and are prepared to keep it current
- An image you are permitted to use; later the Creators API can supply Amazon Program Content automatically
- Long description, pros/cons and specifications so each product detail page has meaningful original content

Do not click/purchase through your own affiliate links to create qualifying sales.

## 3. Test locally
Run:
```
npm install
npm run dev
```
Check:
- `/`
- `/admin.html`
- click a product title/image to open `/product.html?id=...`
- English/Spanish toggle
- all affiliate buttons
- mobile layout

## 4. Production build
Run:
```
npm run build
```
The `dist/` directory includes all three pages: storefront, admin, product detail.

## 5. Deploy
Recommended simple route: import the project into Vercel, set the two VITE Supabase environment variables, deploy, and connect `ezcompra.com`.

## 6. Amazon compliance items included in this version
- Site-level Amazon Associate disclosure
- Link-level `(paid link)` / `(enlace de afiliado)` disclosure
- `rel="nofollow sponsored noopener"` on affiliate links
- Internal detail pages for original editorial content

Review Amazon Associates policies before launch; policies can change.
