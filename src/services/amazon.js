import { client, cloudReady } from './data.js';
import { extractAmazonAsin } from './ai.js';

export function normalizeAmazonProduct(raw = {}, sourceUrl = '') {
  const features = Array.isArray(raw.features) ? raw.features.filter(Boolean) : [];
  return {
    source: 'amazon',
    source_url: sourceUrl || raw.source_url || '',
    asin: raw.asin || extractAmazonAsin(sourceUrl),
    title: raw.title || '',
    brand: raw.brand || '',
    features,
    category: raw.category || 'lifestyle',
    price: raw.price ?? '',
    original_price: raw.original_price ?? '',
    discount: raw.discount || '',
    rating: raw.rating ?? '',
    review_count: raw.review_count || '',
    image_url: raw.image_url || '',
    images: Array.isArray(raw.images) ? raw.images : (raw.image_url ? [raw.image_url] : []),
    affiliate_url: raw.affiliate_url || raw.detail_page_url || '',
    availability: raw.availability || '',
    specifications: raw.specifications || {}
  };
}

export async function fetchAmazonProduct(amazonUrl) {
  const url = String(amazonUrl || '').trim();
  const asin = extractAmazonAsin(url);
  if (!asin) throw new Error('Paste a valid Amazon product URL containing an ASIN.');

  if (!cloudReady || !client) {
    return {
      available: false,
      reason: 'Amazon Creators API is not active yet. Manual source fields remain available until credentials are added.',
      product: normalizeAmazonProduct({ asin }, url)
    };
  }

  const { data, error } = await client.functions.invoke('amazon-product', {
    body: { amazonUrl: url, asin }
  });
  if (error) throw new Error(error.message || 'Amazon import failed.');
  if (!data?.product) throw new Error(data?.error || 'Amazon returned no product data.');
  return { available: true, product: normalizeAmazonProduct(data.product, url) };
}
