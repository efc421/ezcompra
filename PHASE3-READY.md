# EZCOMPRA Phase 3-ready architecture

This version prepares EZCOMPRA for Amazon's current **Creators API**, the supported successor to PA-API 5.

## What is already wired
- `src/services/amazon.js`: frontend Amazon adapter.
- `supabase/functions/amazon-product/index.ts`: secure server-side Amazon adapter.
- Standardized product object so manual input and Amazon API data feed the same AI generator.
- The admin can keep working manually until Amazon credentials are available.

## Secrets to add later (do NOT put these in Vite)

```bash
supabase secrets set AMAZON_CREATORS_CLIENT_ID="..."
supabase secrets set AMAZON_CREATORS_CLIENT_SECRET="..."
supabase secrets set AMAZON_PARTNER_TAG="ezcompra20-20"
```

Then deploy:

```bash
supabase functions deploy amazon-product
```

When Amazon access is approved, no redesign is required. The existing adapter begins returning live Amazon catalog data.
