const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const allowedCategories = ['electronics', 'home', 'beauty', 'lifestyle', 'fitness'];

function extractOutputText(json: any) {
  if (typeof json?.output_text === 'string') return json.output_text;
  for (const item of json?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content?.text === 'string') return content.text;
    }
  }
  return '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured in Supabase secrets.');

    const body = await req.json();
    const title = String(body.title || '').trim();
    const features = String(body.features || '').trim();
    const amazonUrl = String(body.amazonUrl || '').trim();
    const requestedCategory = allowedCategories.includes(body.category) ? body.category : 'lifestyle';
    if (!title || !features) throw new Error('Product title and factual bullet points are required.');

    const prompt = `Create a factual bilingual ecommerce content pack for EZCOMPRA.\n\nSOURCE FACTS ONLY:\nTitle: ${title}\nAmazon URL: ${amazonUrl}\nCategory hint: ${requestedCategory}\nPrice: ${body.price || 'unknown'}\nOriginal price: ${body.originalPrice || 'unknown'}\nRating: ${body.rating || 'unknown'}\nReview count: ${body.reviewCount || 'unknown'}\nFeatures:\n${features}\n\nRules:\n- Never invent technical specifications, awards, compatibility, warranty, performance tests, seller claims, or review results.\n- Do not say EZCOMPRA tested or used the product.\n- Keep English and Spanish natural, concise, and sales-friendly without hype.\n- If a fact is not supplied, omit it.\n- category must be exactly one of: electronics, home, beauty, lifestyle, fitness.\n- description and description_es: max 190 characters.\n- seo_title and seo_title_es: max 65 characters.\n- meta descriptions: max 155 characters.\n- pros/cons should be grounded in supplied facts; a valid con may mention that Amazon price/availability can change.\n\nReturn ONLY valid JSON with exactly these keys:\n{\n  "title":"", "title_es":"", "description":"", "description_es":"", "category":"${requestedCategory}",\n  "long_description":"", "long_description_es":"",\n  "seo_title":"", "seo_title_es":"", "meta_description":"", "meta_description_es":"",\n  "keywords":[], "pros":[], "cons":[], "tags":[], "specifications":{}\n}`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') || 'gpt-5-mini',
        input: [
          { role: 'system', content: 'You create accurate ecommerce copy from supplied facts. Output JSON only.' },
          { role: 'user', content: prompt }
        ],
        text: { format: { type: 'json_object' } }
      })
    });

    const json = await response.json();
    if (!response.ok) throw new Error(json?.error?.message || 'OpenAI request failed.');
    const text = extractOutputText(json);
    if (!text) throw new Error('OpenAI returned an empty response.');
    const product = JSON.parse(text);
    product.asin = String(body.amazonUrl || '').match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/i)?.[1]?.toUpperCase() || '';
    product.source_url = amazonUrl;

    return new Response(JSON.stringify({ product }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
