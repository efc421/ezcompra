const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MARKETPLACE = 'www.amazon.com';

function extractAsin(url = '') {
  const match = String(url).match(/(?:\/dp\/|\/gp\/product\/|\/product\/)([A-Z0-9]{10})(?:[/?]|$)|[?&]asin=([A-Z0-9]{10})(?:&|$)/i);
  return (match?.[1] || match?.[2] || '').toUpperCase();
}

function numberFromMoney(value: any) {
  if (typeof value === 'number') return value;
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

async function getAccessToken() {
  const clientId = Deno.env.get('AMAZON_CREATORS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMAZON_CREATORS_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('Amazon Creators API credentials are not configured yet.');

  // Current North America v3.x credentials use Login with Amazon OAuth 2.0.
  const response = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'creatorsapi::default'
    })
  });
  const json = await response.json();
  if (!response.ok || !json?.access_token) throw new Error(json?.error_description || json?.error || 'Unable to authenticate with Amazon Creators API.');
  return json.access_token as string;
}

function normalizeItem(item: any) {
  const listing = item?.offersV2?.listings?.[0] || item?.offersV2?.listings || {};
  const price = numberFromMoney(listing?.price?.money?.amount ?? listing?.price?.amount ?? listing?.price?.displayAmount);
  const savingBasis = numberFromMoney(listing?.savingBasis?.money?.amount ?? listing?.savingBasis?.amount ?? listing?.savingBasis?.displayAmount);
  const savingsPct = listing?.savings?.percentage ?? null;
  const primary = item?.images?.primary?.large || item?.images?.primary?.medium || item?.images?.primary?.small || {};
  const variants = Array.isArray(item?.images?.variants) ? item.images.variants : [];
  const variantUrls = variants.map((v:any) => v?.large?.url || v?.medium?.url || v?.small?.url).filter(Boolean);
  const byLine = item?.itemInfo?.byLineInfo || {};
  const features = item?.itemInfo?.features?.displayValues || [];

  return {
    asin: item?.asin || '',
    title: item?.itemInfo?.title?.displayValue || '',
    brand: byLine?.brand?.displayValue || byLine?.manufacturer?.displayValue || '',
    features,
    price,
    original_price: savingBasis,
    discount: savingsPct ? `-${savingsPct}%` : '',
    rating: '',
    review_count: '',
    image_url: primary?.url || '',
    images: [primary?.url, ...variantUrls].filter(Boolean),
    affiliate_url: item?.detailPageURL || '',
    detail_page_url: item?.detailPageURL || '',
    availability: listing?.availability?.message || listing?.availability?.type || '',
    specifications: {}
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json();
    const asin = String(body.asin || extractAsin(body.amazonUrl)).toUpperCase();
    if (!asin) throw new Error('A valid Amazon ASIN is required.');

    const partnerTag = Deno.env.get('AMAZON_PARTNER_TAG');
    if (!partnerTag) throw new Error('AMAZON_PARTNER_TAG is not configured.');

    const accessToken = await getAccessToken();
    const response = await fetch('https://creatorsapi.amazon/catalog/v1/getItems', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-marketplace': MARKETPLACE
      },
      body: JSON.stringify({
        itemIds: [asin],
        itemIdType: 'ASIN',
        marketplace: MARKETPLACE,
        partnerTag,
        resources: [
          'images.primary.large',
          'images.variants.large',
          'itemInfo.title',
          'itemInfo.features',
          'itemInfo.byLineInfo',
          'offersV2.listings.price',
          'offersV2.listings.savingBasis',
          'offersV2.listings.savings',
          'offersV2.listings.availability'
        ]
      })
    });

    const json = await response.json();
    if (!response.ok) throw new Error(json?.errors?.[0]?.message || json?.Errors?.[0]?.Message || 'Amazon Creators API request failed.');
    const item = json?.itemsResult?.items?.[0];
    if (!item) throw new Error('Amazon returned no matching item.');

    return new Response(JSON.stringify({ product: normalizeItem(item) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
