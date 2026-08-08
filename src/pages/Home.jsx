import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { getProducts } from '../services/data.js';
import '../styles/site.css';
import '../styles/language.css';

const translations = {
  en:{searchPlaceholder:'Search for products, brands, and more',kicker:'NEW DEALS DAILY',heroTitle:<>Find the <em>Best Deals</em><br/>in Seconds</>,heroText:<>Trending finds. Smart picks.<br/>Big savings.</>,shopDeals:'Shop Top Deals',catTrending:'🔥 Trending',catTech:'▣ Tech',catHome:'⌂ Home',catBeauty:'♙ Beauty',catLifestyle:'♧ Lifestyle',catFitness:'◇ Fitness',handpicked:'HANDPICKED FOR YOU',topDeals:'Today’s Top Deals',loading:'Loading today’s deals…',empty:'No products found. Try another search.',disclosureTitle:'Affiliate disclosure',disclosureText:'As an Amazon Associate I earn from qualifying purchases.',navHome:'Home',navDeals:'Deals',navFavorites:'Favorites',navCategories:'Categories',footerText:'Smart finds, clearly shared.',viewDeal:'View Deal',newLabel:'New',resultSingular:'find',resultPlural:'finds',save:'Save'},
  es:{searchPlaceholder:'Busca productos, marcas y más',kicker:'NUEVAS OFERTAS TODOS LOS DÍAS',heroTitle:<>Encuentra las <em>Mejores Ofertas</em><br/>en Segundos</>,heroText:<>Productos populares. Buenas opciones.<br/>Grandes ahorros.</>,shopDeals:'Ver mejores ofertas',catTrending:'🔥 Tendencias',catTech:'▣ Tecnología',catHome:'⌂ Hogar',catBeauty:'♙ Belleza',catLifestyle:'♧ Estilo de vida',catFitness:'◇ Ejercicio',handpicked:'SELECCIONADOS PARA TI',topDeals:'Mejores ofertas de hoy',loading:'Cargando las ofertas de hoy…',empty:'No encontramos productos. Intenta otra búsqueda.',disclosureTitle:'Divulgación de afiliados',disclosureText:'Como Asociado de Amazon, obtengo ingresos por compras que califican.',navHome:'Inicio',navDeals:'Ofertas',navFavorites:'Favoritos',navCategories:'Categorías',footerText:'Productos útiles, compartidos con claridad.',viewDeal:'Ver oferta',newLabel:'Nuevo',resultSingular:'producto',resultPlural:'productos',save:'Guardar'}
};

const categoryOptions = [
  ['all','catTrending'],['electronics','catTech'],['home','catHome'],['beauty','catBeauty'],['lifestyle','catLifestyle'],['fitness','catFitness']
];

export default function Home() {
  const [language, setLanguage] = useState(() => localStorage.getItem('ezcompra-language') || (navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en'));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('ezcompra-language', language);
  }, [language]);

  useEffect(() => {
    getProducts().then(setProducts).catch(error => { console.error(error); setProducts([]); }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => products.filter(p => {
    const categoryMatch = activeCategory === 'all' || p.category === activeCategory;
    const text = `${p.title} ${p.description} ${p.title_es || ''} ${p.description_es || ''} ${p.category}`.toLowerCase();
    return categoryMatch && text.includes(query.trim().toLowerCase());
  }), [products, query, activeCategory]);

  return <>
    <header className="topbar">
      <button className="icon-btn" aria-label="Open menu">☰</button>
      <a className="logo" href="#top"><span>EZ</span>COMPRA <b>DEALS</b></a>
      <div className="header-actions"><button className="language-toggle" onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}>{language === 'en' ? 'ES' : 'EN'}</button></div>
    </header>
    <main id="top">
      <section className="search-shell" aria-label="Search"><span>⌕</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t.searchPlaceholder}/><button aria-label="Search">⌕</button></section>
      <section className="hero"><div className="hero-copy"><span className="kicker">{t.kicker}</span><h1>{t.heroTitle}</h1><p>{t.heroText}</p><a href="#products" className="hero-button"><span>{t.shopDeals}</span><span>→</span></a></div><div className="hero-art" aria-hidden="true"><span className="cloud cloud-one">☁</span><span className="cloud cloud-two">☁</span><div className="deal-bag"><span>%</span></div><div className="timer">⚡</div></div><div className="slider-dots" aria-hidden="true"><i></i><i></i><i></i></div></section>
      <section className="category-section" aria-label="Categories">{categoryOptions.map(([value,key]) => <button key={value} className={`category ${activeCategory === value ? 'active' : ''}`} onClick={() => setActiveCategory(value)}>{t[key]}</button>)}</section>
      <section id="products" className="products-section"><div className="section-heading"><div><span className="eyebrow">{t.handpicked}</span><h2>{t.topDeals}</h2></div><span>{filtered.length} {filtered.length === 1 ? t.resultSingular : t.resultPlural}</span></div><div className="product-grid" aria-live="polite">{filtered.map(product => <ProductCard key={product.id} product={product} language={language} t={t}/>)}</div>{loading && <div className="state-card">{t.loading}</div>}{!loading && filtered.length === 0 && <div className="state-card">{t.empty}</div>}</section>
      <aside className="disclosure"><span>✓</span><p><strong>{t.disclosureTitle}</strong><br/><span>{t.disclosureText}</span></p></aside>
    </main>
    <nav className="bottom-nav" aria-label="Mobile navigation"><a className="active" href="#top"><span>⌂</span><b>{t.navHome}</b></a><a href="#products"><span>◇</span><b>{t.navDeals}</b></a><a href="#products"><span>♡</span><b>{t.navFavorites}</b></a><a href="#products"><span>▦</span><b>{t.navCategories}</b></a></nav>
    <footer>© {new Date().getFullYear()} EZCOMPRA Deals · {t.footerText}</footer>
  </>;
}
