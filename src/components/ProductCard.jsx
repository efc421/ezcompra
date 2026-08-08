import React from 'react';
export default function ProductCard({ product, language, t }) {
  const title = language === 'es' && product.title_es ? product.title_es : product.title;
  const description = language === 'es' && product.description_es ? product.description_es : product.description;
  const oldPrice = Number(product.original_price || 0);
  const currentPrice = Number(product.price || 0);
  const discountExpired = product.discount_ends_at && new Date(product.discount_ends_at).getTime() <= Date.now();
  const displayedPrice = discountExpired && oldPrice ? oldPrice : currentPrice;
  const discount = discountExpired ? '' : (product.discount || (oldPrice > currentPrice ? `-${Math.round((1-currentPrice/oldPrice)*100)}%` : ''));
  const stars = '★'.repeat(Math.max(0, Math.min(5, Math.round(Number(product.rating || 0)))));
  const money = value => new Intl.NumberFormat(language === 'es' ? 'es-US' : 'en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <a href={`product.html?id=${encodeURIComponent(product.id)}`} className="product-image-link"><img src={product.image_url} alt={title} loading="lazy" /></a>
        {discount && <span className="discount">{discount}</span>}
        <button className="heart" aria-label={`${t.save} ${title}`}>♡</button>
      </div>
      <div className="product-copy">
        <h3><a href={`product.html?id=${encodeURIComponent(product.id)}`}>{title}</a></h3>
        <p className="quick-description">{description}</p>
        <div className="rating"><b>{stars}</b> {Number(product.rating || 0).toFixed(1)} <span>({product.review_count || t.newLabel})</span></div>
        <div className="price-row"><strong>{money(displayedPrice)}</strong>{oldPrice && !discountExpired ? <del>{money(oldPrice)}</del> : null}</div>
        <a className="deal-button" href={product.affiliate_url} target="_blank" rel="nofollow sponsored noopener">{t.viewDeal} <span>→</span></a><small className="card-paid-link">{language === 'es' ? '(enlace de afiliado)' : '(paid link)'}</small>
      </div>
    </article>
  );
}
