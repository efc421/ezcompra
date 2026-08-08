import { client, cloudReady } from './data.js';

export function extractAmazonAsin(url = '') {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /[?&]asin=([A-Z0-9]{10})(?:&|$)/i
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1].toUpperCase();
  }
  return '';
}

const clean = value => String(value || '').trim();

function localDemoGenerate(input) {
  const title = clean(input.title) || 'Sample Amazon Product';
  const features = clean(input.features) || 'Useful everyday features and convenient design';
  const firstFeature = features.split(/\n|•|\.|;/).map(v => v.trim()).filter(Boolean)[0] || 'Convenient everyday performance';
  const category = input.category || 'lifestyle';
  return {
    asin: extractAmazonAsin(input.amazonUrl),
    source_url: input.amazonUrl,
    title,
    title_es: `${title}`,
    description: `${firstFeature}. A practical pick for shoppers looking for value, convenience, and reliable everyday use.`,
    description_es: `${firstFeature}. Una opción práctica para quienes buscan buen valor, comodidad y uso diario confiable.`,
    category,
    seo_title: `${title} Review, Features & Deal | EZCOMPRA`,
    seo_title_es: `${title}: Opinión, Características y Oferta | EZCOMPRA`,
    meta_description: `See the key features, current deal information, and shopping highlights for ${title} on EZCOMPRA.`,
    meta_description_es: `Conoce las características principales, la oferta actual y los puntos destacados de ${title} en EZCOMPRA.`,
    keywords: [title, category, 'Amazon deal', 'product recommendation'],
    pros: ['Convenient everyday use', 'Strong value proposition', 'Easy to compare before buying'],
    cons: ['Price and availability can change on Amazon'],
    long_description: `${title} is designed for shoppers who want ${features.toLowerCase()}. This EZCOMPRA summary focuses on the product facts you supplied and avoids unsupported claims. Always check Amazon for the latest price, availability, and seller information before purchasing.`,
    long_description_es: `${title} está pensado para compradores que buscan ${features.toLowerCase()}. Este resumen de EZCOMPRA se basa en los datos del producto que proporcionaste y evita afirmaciones no verificadas. Revisa Amazon para confirmar el precio, la disponibilidad y el vendedor antes de comprar.`,
    tags: [category, 'deal', 'amazon'],
    specifications: {}
  };
}

export async function generateProductContent(input) {
  if (!clean(input.title)) throw new Error('Add the Amazon product title first. Phase 3 will fill this automatically from Amazon.');
  if (!clean(input.features)) throw new Error('Paste a few Amazon bullet points or product features first. Phase 3 will fill these automatically.');

  if (!cloudReady || !client) {
    return { data: localDemoGenerate(input), demo: true };
  }

  const { data, error } = await client.functions.invoke('generate-product', { body: input });
  if (error) throw new Error(error.message || 'AI generation failed.');
  if (!data?.product) throw new Error(data?.error || 'The AI function returned no product data.');
  return { data: data.product, demo: false };
}
