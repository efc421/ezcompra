import React, { useEffect, useMemo, useState } from 'react';
import { getProductById } from '../services/data.js';
import '../styles/site.css';
import '../styles/product-detail.css';

const copy = {
  en: {
    back:'← Back to deals', reviews:'reviews', overview:'Why we picked it', specs:'Specifications', pros:'What stands out', cons:'Things to consider', cta:'Check price on Amazon', paid:'(paid link)', disclosure:'As an Amazon Associate I earn from qualifying purchases.', notFound:'Product not found.', loading:'Loading product…', switch:'ES'
  },
  es: {
    back:'← Volver a las ofertas', reviews:'reseñas', overview:'Por qué lo elegimos', specs:'Especificaciones', pros:'Lo mejor', cons:'A tener en cuenta', cta:'Ver precio en Amazon', paid:'(enlace de afiliado)', disclosure:'Como Asociado de Amazon, obtengo ingresos por compras que califican.', notFound:'Producto no encontrado.', loading:'Cargando producto…', switch:'EN'
  }
};

export default function ProductDetail(){
  const [language,setLanguage] = useState(() => localStorage.getItem('ezcompra-language') || 'en');
  const [product,setProduct] = useState(null);
  const [loading,setLoading] = useState(true);
  const id = useMemo(() => new URLSearchParams(location.search).get('id'), []);
  const t = copy[language];

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('ezcompra-language',language);
  },[language]);

  useEffect(() => {
    getProductById(id).then(setProduct).catch(console.error).finally(()=>setLoading(false));
  },[id]);

  if(loading) return <main className="detail-state">{t.loading}</main>;
  if(!product) return <main className="detail-state"><a href="index.html">{t.back}</a><h1>{t.notFound}</h1></main>;

  const title = language === 'es' && product.title_es ? product.title_es : product.title;
  const description = language === 'es' && product.description_es ? product.description_es : product.description;
  const longDescription = language === 'es' && product.long_description_es ? product.long_description_es : (product.long_description || description);
  const specs = product.specifications && typeof product.specifications === 'object' ? Object.entries(product.specifications) : [];
  const money = value => new Intl.NumberFormat(language === 'es' ? 'es-US' : 'en-US',{style:'currency',currency:'USD'}).format(Number(value || 0));
  const oldPrice = Number(product.original_price || 0);
  const currentPrice = Number(product.price || 0);
  const stars = '★'.repeat(Math.max(0,Math.min(5,Math.round(Number(product.rating || 0)))));
  const pros = Array.isArray(product.pros) ? product.pros : [];
  const cons = Array.isArray(product.cons) ? product.cons : [];

  return <>
    <header className="topbar detail-header">
      <a className="logo" href="index.html"><span>EZ</span>COMPRA <b>DEALS</b></a>
      <button className="language-toggle" onClick={()=>setLanguage(language==='en'?'es':'en')}>{t.switch}</button>
    </header>
    <main className="detail-page">
      <a className="detail-back" href="index.html#products">{t.back}</a>
      <article className="detail-hero">
        <div className="detail-image"><img src={product.image_url} alt={title}/>{product.discount && <span className="discount">{product.discount}</span>}</div>
        <div className="detail-copy">
          <span className="detail-category">{product.category}</span>
          <h1>{title}</h1>
          <p className="detail-quick">{description}</p>
          <div className="detail-rating"><b>{stars}</b> {Number(product.rating || 0).toFixed(1)} <span>({product.review_count || 0} {t.reviews})</span></div>
          <div className="detail-price"><strong>{money(currentPrice)}</strong>{oldPrice > currentPrice ? <del>{money(oldPrice)}</del> : null}</div>
          <div className="affiliate-cta-wrap"><a className="detail-cta" href={product.affiliate_url} target="_blank" rel="nofollow sponsored noopener">{t.cta} →</a><span className="paid-link">{t.paid}</span></div>
          <p className="price-note">Price and availability can change on Amazon.</p>
        </div>
      </article>

      <section className="detail-section"><h2>{t.overview}</h2><p>{longDescription}</p></section>
      {specs.length > 0 && <section className="detail-section"><h2>{t.specs}</h2><dl className="spec-grid">{specs.map(([key,value])=><React.Fragment key={key}><dt>{key.replaceAll('_',' ')}</dt><dd>{String(value)}</dd></React.Fragment>)}</dl></section>}
      {(pros.length > 0 || cons.length > 0) && <section className="pros-cons">{pros.length > 0 && <div><h2>{t.pros}</h2><ul>{pros.map((p,i)=><li key={i}>✓ {p}</li>)}</ul></div>}{cons.length > 0 && <div><h2>{t.cons}</h2><ul>{cons.map((c,i)=><li key={i}>• {c}</li>)}</ul></div>}</section>}
      <aside className="amazon-required-disclosure"><strong>{t.disclosure}</strong></aside>
    </main>
    <footer>© {new Date().getFullYear()} EZCOMPRA Deals</footer>
  </>;
}
