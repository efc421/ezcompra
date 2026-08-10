import React, { useEffect, useMemo, useState } from 'react';
import { getProductById } from '../services/data.js';
import '../styles/site.css';
import '../styles/product-detail.css';

const FAVORITES_KEY = 'ezcompra-favorites-v1';

const copy = {
  en: {
    back: '← Back to deals',
    reviews: 'reviews',
    overview: 'Why we picked it',
    specs: 'Specifications',
    pros: 'What stands out',
    cons: 'Things to consider',
    cta: 'Buy on Amazon',
    paid: '(paid link)',
    disclosure: 'As an Amazon Associate I earn from qualifying purchases.',
    notFound: 'Product not found.',
    loading: 'Loading product…',
    switch: 'ES',
    priceNote: 'Price and availability can change on Amazon.',
    save: 'Save',
    saved: 'Saved',
    removeFavorite: 'Remove from favorites'
  },
  es: {
    back: '← Volver a las ofertas',
    reviews: 'reseñas',
    overview: 'Por qué lo elegimos',
    specs: 'Especificaciones',
    pros: 'Lo mejor',
    cons: 'A tener en cuenta',
    cta: 'Comprar en Amazon',
    paid: '(enlace de afiliado)',
    disclosure: 'Como Asociado de Amazon, obtengo ingresos por compras que califican.',
    notFound: 'Producto no encontrado.',
    loading: 'Cargando producto…',
    switch: 'EN',
    priceNote: 'El precio y la disponibilidad pueden cambiar en Amazon.',
    save: 'Guardar',
    saved: 'Guardado',
    removeFavorite: 'Quitar de favoritos'
  }
};

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export default function ProductDetail() {
  const [language, setLanguage] = useState(
    () => localStorage.getItem('ezcompra-language') || 'en'
  );
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(readFavorites);

  const id = useMemo(
    () => new URLSearchParams(location.search).get('id'),
    []
  );

  const t = copy[language];

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('ezcompra-language', language);
  }, [language]);

  useEffect(() => {
    getProductById(id)
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  if (loading) {
    return (
      <>
        <header className="topbar detail-header">
          <a href="index.html" className="logo">
            <span>EZ</span>COMPRA <b>DEALS</b>
          </a>
        </header>
        <main className="detail-state">
          <p>{t.loading}</p>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <header className="topbar detail-header">
          <a href="index.html" className="logo">
            <span>EZ</span>COMPRA <b>DEALS</b>
          </a>
        </header>
        <main className="detail-state">
          <a href="index.html" className="detail-back">{t.back}</a>
          <h1>{t.notFound}</h1>
        </main>
      </>
    );
  }

  const title =
    language === 'es' && product.title_es
      ? product.title_es
      : product.title;

  const description =
    language === 'es' && product.description_es
      ? product.description_es
      : product.description;

  const longDescription =
    language === 'es' && product.long_description_es
      ? product.long_description_es
      : (product.long_description || description);

  const specs =
    product.specifications &&
    typeof product.specifications === 'object'
      ? Object.entries(product.specifications).filter(([key, value]) => {
          const normalizedKey = String(key).toLowerCase().replace(/[_\s-]+/g, '');
          const stringValue = String(value || '').trim().toLowerCase();

          const isLinkField =
            normalizedKey.includes('url') ||
            normalizedKey.includes('link') ||
            normalizedKey.includes('affiliate') ||
            normalizedKey.includes('amazonurl') ||
            normalizedKey.includes('producturl');

          const looksLikeUrl =
            stringValue.startsWith('http://') ||
            stringValue.startsWith('https://') ||
            stringValue.includes('amazon.com/') ||
            stringValue.includes('bestbuy.com/') ||
            stringValue.includes('walmart.com/');

          return !isLinkField && !looksLikeUrl;
        })
      : [];

  const money = value =>
    new Intl.NumberFormat(
      language === 'es' ? 'es-US' : 'en-US',
      { style: 'currency', currency: 'USD' }
    ).format(Number(value || 0));

  const oldPrice = Number(product.original_price || 0);
  const currentPrice = Number(product.price || 0);
  const rating = Number(product.rating || 0);

  const stars = '★'.repeat(
    Math.max(0, Math.min(5, Math.round(rating)))
  );

  const pros = Array.isArray(product.pros) ? product.pros : [];
  const cons = Array.isArray(product.cons) ? product.cons : [];

  const productId = String(product.id);
  const isFavorite = favorites.includes(productId);

  function toggleFavorite() {
    setFavorites(current =>
      current.includes(productId)
        ? current.filter(savedId => savedId !== productId)
        : [productId, ...current]
    );
  }

  return (
    <>
      <header className="topbar detail-header">
        <a href="index.html" className="logo">
          <span>EZ</span>COMPRA <b>DEALS</b>
        </a>

        <button
          className="language-toggle"
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
        >
          {t.switch}
        </button>
      </header>

      <main className="detail-page">
        <a href="index.html" className="detail-back">
          {t.back}
        </a>

        <section className="detail-hero">
          <div className="detail-image">
            {product.discount && (
              <span className="detail-discount">
                {product.discount}
              </span>
            )}

            <button
              type="button"
              className={`detail-favorite ${isFavorite ? 'is-favorite' : ''}`}
              onClick={toggleFavorite}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? t.removeFavorite : t.save}
            >
              <span>{isFavorite ? '♥' : '♡'}</span>
            </button>

            {product.image_url ? (
              <img src={product.image_url} alt={title} />
            ) : (
              <div className="detail-image-placeholder">No image</div>
            )}
          </div>

          <div className="detail-copy">
            <span className="detail-category">
              {product.category}
            </span>

            <h1>{title}</h1>

            {description && (
              <p className="detail-quick">
                {description}
              </p>
            )}

            <div className="detail-rating">
              <b>{stars}</b>{' '}
              {rating.toFixed(1)}{' '}
              <span>
                ({product.review_count || 0} {t.reviews})
              </span>
            </div>

            <div className="detail-price">
              <strong>{money(currentPrice)}</strong>
              {oldPrice > currentPrice && (
                <del>{money(oldPrice)}</del>
              )}
            </div>

            <div className="affiliate-cta-wrap">
              <a
                href={product.affiliate_url}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="detail-cta"
              >
                {t.cta} →
              </a>

              <span className="paid-link">
                {t.paid}
              </span>
            </div>

            <p className="price-note">
              {t.priceNote}
            </p>
          </div>
        </section>

        <section className="detail-section">
          <h2>{t.overview}</h2>
          <p>{longDescription}</p>
        </section>

        {specs.length > 0 && (
          <section className="detail-section">
            <h2>{t.specs}</h2>

            <dl className="spec-grid">
              {specs.map(([key, value]) => (
                <React.Fragment key={key}>
                  <dt>{key.replaceAll('_', ' ')}</dt>
                  <dd>{String(value)}</dd>
                </React.Fragment>
              ))}
            </dl>
          </section>
        )}

        {(pros.length > 0 || cons.length > 0) && (
          <section className="pros-cons">
            {pros.length > 0 && (
              <div>
                <h2>{t.pros}</h2>
                <ul>
                  {pros.map((p, i) => (
                    <li key={i}>✓ {p}</li>
                  ))}
                </ul>
              </div>
            )}

            {cons.length > 0 && (
              <div>
                <h2>{t.cons}</h2>
                <ul>
                  {cons.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <aside className="amazon-required-disclosure">
          <strong>{t.disclosure}</strong>
        </aside>
      </main>

      <footer>
        © {new Date().getFullYear()} EZCOMPRA Deals
      </footer>
    </>
  );
}