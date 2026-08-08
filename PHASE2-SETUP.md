# EZCOMPRA Phase 2 — AI Product Generator

The Phase 2 screen is already built into `admin.html`.

## Test the UI immediately

Run:

```bash
npm run dev
```

Then open:

- Store: http://localhost:5173/
- Admin: http://localhost:5173/admin.html

If Supabase is not connected, the AI button runs in **LOCAL DEMO** mode so you can test the workflow without an API key.

## Activate real AI generation

### 1. Update the Supabase database

Open your Supabase project → SQL Editor and run the updated `supabase-setup.sql` file. The Phase 2 lines use `add column if not exists`, so they are safe to run on the existing table.

### 2. Install/login to Supabase CLI

From the project folder:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Add your OpenAI API key as a Supabase secret

Do NOT put the OpenAI key in `.env` or any `VITE_` variable. Browser-visible keys are insecure.

```bash
npx supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

Optional model override:

```bash
npx supabase secrets set OPENAI_MODEL=gpt-5-mini
```

### 4. Deploy the secure AI function

```bash
npx supabase functions deploy generate-product
```

Now refresh `admin.html`. If `.env` contains your Supabase URL and anon key and you are signed in, **Generate Product with AI** calls the server-side function.

## Current Phase 2 workflow

1. Paste Amazon product URL.
2. Paste the product title and Amazon factual bullet points.
3. Click **Generate Product with AI**.
4. EZCOMPRA fills English + Spanish short copy, long copy, SEO metadata, keywords, pros/cons, tags, category and ASIN.
5. Add current price, rating, official affiliate URL, and product image.
6. Review and publish.

## What Phase 3 changes

Phase 3 connects the official Amazon Product Advertising API so the Amazon URL can automatically provide supported product data such as title, images and offer information. That removes most of the remaining copy/paste work.
