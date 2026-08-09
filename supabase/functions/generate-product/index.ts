const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const allowedCategories = [
  'electronics',
  'home',
  'beauty',
  'lifestyle',
  'fitness'
];

function extractOutputText(json: any) {
  if (typeof json?.output_text === 'string') {
    return json.output_text;
  }

  for (const item of json?.output || []) {
    for (const content of item?.content || []) {
      if (
        content?.type === 'output_text' &&
        typeof content?.text === 'string'
      ) {
        return content.text;
      }
    }
  }

  return '';
}

Deno.serve(async (req) => {
  // Browser CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is not configured in Supabase secrets.'
      );
    }

    const body = await req.json();

    const title = String(body.title || '').trim();
    const features = String(body.features || '').trim();
    const amazonUrl = String(body.amazonUrl || '').trim();

    const requestedCategory = allowedCategories.includes(body.category)
      ? body.category
      : 'lifestyle';

    if (!title) {
      throw new Error('Product title is required.');
    }

    if (!features) {
      throw new Error('Product factual bullet points are required.');
    }

    const prompt = `
Create a factual bilingual ecommerce content pack for EZCOMPRA.

SOURCE FACTS ONLY:

Title: ${title}
Amazon URL: ${amazonUrl}
Category hint: ${requestedCategory}
Price: ${body.price || 'unknown'}
Original price: ${body.originalPrice || 'unknown'}
Rating: ${body.rating || 'unknown'}
Review count: ${body.reviewCount || 'unknown'}

Features:
${features}

Rules:
- Never invent technical specifications.
- Never invent awards.
- Never invent compatibility.
- Never invent warranty information.
- Never invent product testing.
- Never invent review results.
- Never claim EZCOMPRA tested or personally used the product.
- Keep English and Spanish natural and concise.
- If a fact is not supplied, omit it.
- category must be exactly one of:
  electronics, home, beauty, lifestyle, fitness.
- description and description_es: maximum 190 characters.
- seo_title and seo_title_es: maximum 65 characters.
- meta_description and meta_description_es: maximum 155 characters.
- Pros and cons must be grounded in supplied facts.
- A valid con may mention that Amazon price and availability can change.

Return ONLY valid JSON with exactly these keys:

{
  "title": "",
  "title_es": "",
  "description": "",
  "description_es": "",
  "category": "${requestedCategory}",
  "long_description": "",
  "long_description_es": "",
  "seo_title": "",
  "seo_title_es": "",
  "meta_description": "",
  "meta_description_es": "",
  "keywords": [],
  "pros": [],
  "cons": [],
  "tags": [],
  "specifications": {}
}
`;

    const response = await fetch(
      'https://api.openai.com/v1/responses',
      {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          model:
            Deno.env.get('OPENAI_MODEL') ||
            'gpt-5-mini',

          input: [
            {
              role: 'system',
              content:
                'You create accurate ecommerce copy only from supplied product facts. Output valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],

          text: {
            format: {
              type: 'json_object',
            },
          },
        }),
      }
    );

    const json = await response.json();

    if (!response.ok) {
      throw new Error(
        json?.error?.message ||
          'OpenAI request failed.'
      );
    }

    const text = extractOutputText(json);

    if (!text) {
      throw new Error(
        'OpenAI returned an empty response.'
      );
    }

    let product;

    try {
      product = JSON.parse(text);
    } catch {
      throw new Error(
        'OpenAI returned invalid JSON.'
      );
    }

    product.asin =
      amazonUrl
        .match(
          /(?:\/dp\/|\/gp\/product\/|\/product\/)([A-Z0-9]{10})/i
        )?.[1]
        ?.toUpperCase() || '';

    product.source_url = amazonUrl;

    return new Response(
      JSON.stringify({
        product,
      }),
      {
        status: 200,

        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('generate-product error:', error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      }),
      {
        status: 400,

        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});