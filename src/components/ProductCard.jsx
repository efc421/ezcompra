import React from 'react';

export default function ProductCard({ product, language, t }) {
  const title =
    language === 'es' && product.title_es
      ? product.title_es
      : product.title;

  const description =
    language === 'es' && product.description_es
      ? product.description_es
      : product.description;

  const oldPrice = Number(product.original_price || 0);
  const currentPrice = Number(product.price || 0);

  const discountExpired =
    product.discount_ends_at &&
    new Date(product.discount_ends_at).getTime() <= Date.now();

  const displayedPrice =
    discountExpired && oldPrice
      ? oldPrice
      : currentPrice;

  const discount = discountExpired
    ? ''
    : (
        product.discount ||
        (
          oldPrice > currentPrice
            ? `-${Math.round((1 - currentPrice / oldPrice) * 100)}%`
            : ''
        )
      );

  const rating = Number(product.rating || 0);

  const stars = '★'.repeat(
    Math.max(0, Math.min(5, Math.round(rating)))
  );

  const money = value =>
    new Intl.NumberFormat(
      language === 'es' ? 'es-US' : 'en-US',
      {
        style: 'currency',
        currency: 'USD'
      }
    ).format(Number(value || 0));

  const productUrl =
    `product.html?id=${encodeURIComponent(product.id)}`;

  return (
    <article className="product-card">

      <div className="product-image-area">
        <a
          href={productUrl}
          className="product-image-link"
          aria-label={title}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={title}
              className="product-card-image"
              loading="lazy"
            />
          ) : (
            <div className="product-image-placeholder">
              No image
            </div>
          )}
        </a>

        {discount && (
          <span className="discount-badge">
            {discount}
          </span>
        )}

        <button
          type="button"
          className="heart"
          aria-label={`${t.save} ${title}`}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          ♡
        </button>
      </div>

      <div className="product-card-content">

        <a
          href={productUrl}
          className="product-card-title"
        >
          {title}
        </a>

        {description && (
          <p className="product-card-description">
            {description}
          </p>
        )}

        <div className="product-rating">
          <span className="stars">
            {stars}
          </span>

          <span>
            {rating.toFixed(1)}
          </span>

          <span className="review-count">
            ({product.review_count || t.newLabel})
          </span>
        </div>

        <div className="product-price-row">
          <strong className="product-price">
            {money(displayedPrice)}
          </strong>

          {oldPrice > displayedPrice && !discountExpired && (
            <span className="product-old-price">
              {money(oldPrice)}
            </span>
          )}
        </div>

        <a
          href={productUrl}
          className="view-deal-button"
        >
          <span>{t.viewDeal}</span>
          <span>→</span>
        </a>

        <div className="paid-link-label">
          {language === 'es'
            ? '(enlace de afiliado)'
            : '(paid link)'}
        </div>

      </div>

    </article>
  );
}