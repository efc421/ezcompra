import React, { useEffect, useMemo, useRef, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { getProducts } from '../services/data.js';
import '../styles/site.css';
import '../styles/language.css';

const FAVORITES_KEY = 'ezcompra-favorites-v1';

const translations = {
  en: {
    searchPlaceholder: 'Search for products, brands, and more',
    kicker: 'NEW DEALS DAILY',
    heroTitle: <>Find the Best Deals<br />in Seconds</>,
    heroText: <>Trending finds. Smart picks.<br />Big savings.</>,
    shopDeals: 'Shop Top Deals',
    catTrending: '🔥 Trending',
    catTech: '▣ Tech',
    catHome: '⌂ Home',
    catBeauty: '♙ Beauty',
    catLifestyle: '♧ Lifestyle',
    catFitness: '◇ Fitness',
    handpicked: 'HANDPICKED FOR YOU',
    topDeals: 'Today’s Top Deals',
    favoritesTitle: 'Your Favorites',
    favoritesEyebrow: 'SAVED FOR LATER',
    favoritesEmpty: 'You haven’t saved any deals yet. Tap the heart on a product to add it here.',
    loading: 'Loading today’s deals…',
    empty: 'No products found. Try another search.',
    disclosureTitle: 'Affiliate disclosure',
    disclosureText: 'As an Amazon Associate I earn from qualifying purchases.',
    navHome: 'Home',
    navDeals: 'Deals',
    navFavorites: 'Favorites',
    navCategories: 'Categories',
    footerText: 'Smart finds, clearly shared.',
    viewDeal: 'View Deal',
    newLabel: 'New',
    resultSingular: 'find',
    resultPlural: 'finds',
    save: 'Save',
    removeFavorite: 'Remove from favorites',
    trendingTitle: 'Trending Deals Today',
    trustHandpicked: 'Hand-picked deals',
    trustRatings: 'Real product ratings',
    trustRetailers: 'Direct to trusted retailers'
  },
  es: {
    searchPlaceholder: 'Busca productos, marcas y más',
    kicker: 'NUEVAS OFERTAS TODOS LOS DÍAS',
    heroTitle: <>Encuentra las Mejores Ofertas<br />en Segundos</>,
    heroText: <>Productos populares. Buenas opciones.<br />Grandes ahorros.</>,
    shopDeals: 'Ver mejores ofertas',
    catTrending: '🔥 Tendencias',
    catTech: '▣ Tecnología',
    catHome: '⌂ Hogar',
    catBeauty: '♙ Belleza',
    catLifestyle: '♧ Estilo de vida',
    catFitness: '◇ Ejercicio',
    handpicked: 'SELECCIONADOS PARA TI',
    topDeals: 'Mejores ofertas de hoy',
    favoritesTitle: 'Tus Favoritos',
    favoritesEyebrow: 'GUARDADOS PARA DESPUÉS',
    favoritesEmpty: 'Todavía no guardaste ninguna oferta. Toca el corazón de un producto para agregarlo aquí.',
    loading: 'Cargando las ofertas de hoy…',
    empty: 'No encontramos productos. Intenta otra búsqueda.',
    disclosureTitle: 'Divulgación de afiliados',
    disclosureText: 'Como Asociado de Amazon, obtengo ingresos por compras que califican.',
    navHome: 'Inicio',
    navDeals: 'Ofertas',
    navFavorites: 'Favoritos',
    navCategories: 'Categorías',
    footerText: 'Productos útiles, compartidos con claridad.',
    viewDeal: 'Ver oferta',
    newLabel: 'Nuevo',
    resultSingular: 'producto',
    resultPlural: 'productos',
    save: 'Guardar',
    removeFavorite: 'Quitar de favoritos',
    trendingTitle: 'Ofertas en Tendencia Hoy',
    trustHandpicked: 'Ofertas seleccionadas',
    trustRatings: 'Calificaciones reales',
    trustRetailers: 'Directo a tiendas confiables'
  }
};

const categoryOptions = [
  ['all', 'catTrending'],
  ['electronics', 'catTech'],
  ['home', 'catHome'],
  ['beauty', 'catBeauty'],
  ['lifestyle', 'catLifestyle'],
  ['fitness', 'catFitness']
];

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const [language, setLanguage] = useState(
    () =>
      localStorage.getItem('ezcompra-language') ||
      (navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en')
  );

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [view, setView] = useState('home');
  const [favorites, setFavorites] = useState(readFavorites);

  const productsRef = useRef(null);
  const categoriesRef = useRef(null);

  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('ezcompra-language', language);
  }, [language]);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(error => {
        console.error(error);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  // Trending: pick up to 4 for desktop; remains horizontally scrollable on mobile via CSS
  const trending = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  const trendingIds = useMemo(() => new Set(trending.map(p => String(p.id))), [trending]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const base = products.filter(product => {
      const categoryMatch =
        activeCategory === 'all' || product.category === activeCategory;

      const favoriteMatch =
        view !== 'favorites' || favoriteSet.has(String(product.id));

      const text = `${product.title || ''} ${product.description || ''} ${product.title_es || ''} ${product.description_es || ''} ${product.category || ''}`.toLowerCase();

      return categoryMatch && favoriteMatch && text.includes(normalizedQuery);
    });

    // Exclude trending items from the main Top Deals list (but not in Favorites view)
    if (view !== 'favorites') {
      return base.filter(p => !trendingIds.has(String(p.id)));
    }

    return base;
  }, [products, query, activeCategory, view, favoriteSet, trendingIds]);

  function toggleFavorite(productId) {
    const id = String(productId);
    setFavorites(current =>
      current.includes(id)
        ? current.filter(savedId => savedId !== id)
        : [id, ...current]
    );
  }

  function scrollToProducts() {
    productsRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  function showHome() {
    setView('home');
    setActiveCategory('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showDeals() {
    setView('home');
    setTimeout(scrollToProducts, 0);
  }

  function showFavorites() {
    setView('favorites');
    setActiveCategory('all');
    setQuery('');
    setTimeout(scrollToProducts, 0);
  }

  function showCategories() {
    setView('home');
    categoriesRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  function handleSearchChange(event) {
    setQuery(event.target.value);
    setView('home');

    if (event.target.value.trim()) {
      setTimeout(scrollToProducts, 40);
    }
  }

  return (
    <>
      <header className="topbar">
        <button className="icon-btn" type="button" aria-label="Menu">
          ☰
        </button>

        <a href="#top" className="logo" onClick={showHome}>
          <span>EZ</span>COMPRA <b>DEALS</b>
        </a>

        <button
          className="language-toggle"
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
        >
          {language === 'en' ? 'ES' : 'EN'}
        </button>
      </header>

      <div className="search-shell">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          value={query}
          onChange={handleSearchChange}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
        />
        <button type="button" aria-label="Search" onClick={scrollToProducts}>
          ⌕
        </button>
      </div>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <span className="kicker">{t.kicker}</span>
            <h1>{t.heroTitle}</h1>
            <p>{t.heroText}</p>
            <button className="hero-button" type="button" onClick={showDeals}>
              {t.shopDeals} <span>→</span>
            </button>
          </div>

          <div className="hero-art" aria-hidden="true">
            <span className="cloud cloud-one">☁</span>
            <span className="cloud cloud-two">☁</span>
            <div className="deal-bag"><span>%</span></div>
            <div className="timer">⚡</div>
          </div>

          <div className="slider-dots" aria-hidden="true">
            <i></i><i></i><i></i>
          </div>
        </section>

        {/* Trending Deals Today */}
        {trending.length > 0 && (
          <section className="trending-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">{t.handpicked}</span>
                <h2>{t.trendingTitle}</h2>
              </div>
              <span>{trending.length} {trending.length === 1 ? t.resultSingular : t.resultPlural}</span>
            </div>

            <div className="trending-row">
              {trending.map(product => (
                <ProductCard
                  key={`trending-${product.id}`}
                  product={product}
                  language={language}
                  t={t}
                  isFavorite={favoriteSet.has(String(product.id))}
                  onToggleFavorite={() => toggleFavorite(product.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Trust strip below trending */}
        {trending.length > 0 && (
          <section className="trust-strip">
            <div className="trust-item"><i>✓</i><span>{t.trustHandpicked}</span></div>
            <div className="trust-item"><i>★</i><span>{t.trustRatings}</span></div>
            <div className="trust-item"><i>↗</i><span>{t.trustRetailers}</span></div>
          </section>
        )}

        <section className="category-section" ref={categoriesRef}>
          {categoryOptions.map(([value, key]) => (
            <button
              key={value}
              type="button"
              className={`category ${activeCategory === value ? 'active' : ''}`}
              onClick={() => {
                setView('home');
                setActiveCategory(value);
                setTimeout(scrollToProducts, 20);
              }}
            >
              {t[key]}
            </button>
          ))}
        </section>

        <section className="products-section" ref={productsRef}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {view === 'favorites' ? t.favoritesEyebrow : t.handpicked}
              </span>
              <h2>
                {view === 'favorites' ? t.favoritesTitle : t.topDeals}
              </h2>
            </div>

            <span>
              {filtered.length}{' '}
              {filtered.length === 1 ? t.resultSingular : t.resultPlural}
            </span>
          </div>

          {loading && <div className="state-card">{t.loading}</div>}

          {!loading && filtered.length > 0 && (
            <div className="product-grid">
              {filtered.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  language={language}
                  t={t}
                  isFavorite={favoriteSet.has(String(product.id))}
                  onToggleFavorite={() => toggleFavorite(product.id)}
                />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="state-card">
              {view === 'favorites' ? t.favoritesEmpty : t.empty}
            </div>
          )}
        </section>

        <section className="disclosure">
          <span>✓</span>
          <p>
            <strong>{t.disclosureTitle}</strong><br />
            {t.disclosureText}
          </p>
        </section>
      </main>

      <nav className="bottom-nav">
        <button
          type="button"
          className={view === 'home' ? 'active' : ''}
          onClick={showHome}
        >
          <span>⌂</span>
          {t.navHome}
        </button>

        <button type="button" onClick={showDeals}>
          <span>◇</span>
          {t.navDeals}
        </button>

        <button
          type="button"
          className={view === 'favorites' ? 'active favorite-nav-button' : 'favorite-nav-button'}
          onClick={showFavorites}
        >
          <span>{favorites.length ? '♥' : '♡'}</span>
          {t.navFavorites}
          {favorites.length > 0 && (
            <b className="favorite-count">{favorites.length}</b>
          )}
        </button>

        <button type="button" onClick={showCategories}>
          <span>▦</span>
          {t.navCategories}
        </button>
      </nav>

      <footer>
        © {new Date().getFullYear()} EZCOMPRA Deals · {t.footerText}
      </footer>
    </>
  );
}
