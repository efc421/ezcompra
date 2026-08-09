import React, { useEffect, useMemo, useState } from 'react';
import { cloudReady, deleteProduct, getAllProducts, saveProduct, session, signIn, signOut } from '../services/data.js';
import { extractAmazonAsin, generateProductContent } from '../services/ai.js';
import { fetchAmazonProduct } from '../services/amazon.js';
import '../styles/admin.css';
import '../styles/discount-automation.css';

const initialForm = {
  id:'', title:'', description:'', title_es:'', description_es:'', category:'electronics', rating:'4.8',
  price:'', original_price:'', review_count:'', discount:'', discount_ends_at:'', affiliate_url:'',
  image_url:'', is_active:true, asin:'', source_url:'', long_description:'', long_description_es:'',
  seo_title:'', seo_title_es:'', meta_description:'', meta_description_es:'', keywords:[], pros:[],
  cons:[], tags:[], specifications:{}
};

const initialImporter = { amazonUrl:'', title:'', features:'', category:'electronics' };
const queueStorageKey = 'ezcompra-product-queue-v1';
const arr = value => Array.isArray(value) ? value : [];

const calculateDiscount = (originalPrice, dealPrice) => {
  const original = Number(originalPrice);
  const deal = Number(dealPrice);
  if (!Number.isFinite(original) || !Number.isFinite(deal) || original <= 0 || deal < 0 || deal >= original) return '';
  return `-${Math.round(((original - deal) / original) * 100)}%`;
};

const priceSavings = (originalPrice, dealPrice) => {
  const original = Number(originalPrice);
  const deal = Number(dealPrice);
  if (!Number.isFinite(original) || !Number.isFinite(deal) || original <= deal) return '';
  return (original - deal).toFixed(2);
};

const toLocalDateTime = value => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date - offset).toISOString().slice(0,16);
};

const readQueue = () => {
  try {
    const saved = localStorage.getItem(queueStorageKey);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [importer, setImporter] = useState(initialImporter);
  const [generating, setGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [contentPackOpen, setContentPackOpen] = useState(false);
  const [amazonLoading, setAmazonLoading] = useState(false);
  const [amazonMessage, setAmazonMessage] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [queue, setQueue] = useState(() => readQueue());
  const [queueMessage, setQueueMessage] = useState('');
  const [queueFilter, setQueueFilter] = useState('all');
  const [autoPreparing, setAutoPreparing] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('all');
  const [productStatus, setProductStatus] = useState('all');
  const [productSort, setProductSort] = useState('newest');

  const asin = useMemo(() => extractAmazonAsin(importer.amazonUrl), [importer.amazonUrl]);
  const loadProducts = async () => setProducts(await getAllProducts());

  const existingProduct = useMemo(() => {
    const currentAsin = extractAmazonAsin(importer.amazonUrl) || form.asin;
    const currentUrl = importer.amazonUrl.trim() || form.source_url;
    return products.find(product =>
      product.id !== form.id && (
        (currentAsin && product.asin && product.asin === currentAsin) ||
        (currentUrl && product.source_url && product.source_url === currentUrl)
      )
    ) || null;
  }, [products, importer.amazonUrl, form.asin, form.source_url, form.id]);

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();

    const list = products.filter(product => {
      const title = String(product.title || '').toLowerCase();
      const asinValue = String(product.asin || '').toLowerCase();
      const category = String(product.category || '').toLowerCase();

      const matchesSearch =
        !search ||
        title.includes(search) ||
        asinValue.includes(search) ||
        category.includes(search);

      const matchesCategory =
        productCategory === 'all' ||
        product.category === productCategory;

      const matchesStatus =
        productStatus === 'all' ||
        (productStatus === 'live' && product.is_active !== false) ||
        (productStatus === 'hidden' && product.is_active === false);

      return matchesSearch && matchesCategory && matchesStatus;
    });

    return [...list].sort((a, b) => {
      if (productSort === 'price-low') return Number(a.price || 0) - Number(b.price || 0);
      if (productSort === 'price-high') return Number(b.price || 0) - Number(a.price || 0);
      if (productSort === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
      if (productSort === 'discount') {
        const discountValue = value => Number(String(value || '').replace(/[^0-9.-]/g, '')) || 0;
        return Math.abs(discountValue(b.discount)) - Math.abs(discountValue(a.discount));
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [products, productSearch, productCategory, productStatus, productSort]);

  useEffect(() => {
    session().then(s => {
      setAuthenticated(Boolean(s));
      setChecking(false);
      if (s) loadProducts();
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(queueStorageKey, JSON.stringify(queue));
  }, [queue]);

  const update = (name, value) => setForm(current => ({ ...current, [name]: value }));
  const updateImporter = (name, value) => setImporter(current => ({ ...current, [name]: value }));

  const updateOriginalPrice = value => {
    setForm(current => ({
      ...current,
      original_price:value,
      discount:calculateDiscount(value, current.price)
    }));
  };

  const updateDealPrice = value => {
    setForm(current => ({
      ...current,
      price:value,
      discount:calculateDiscount(current.original_price, value)
    }));
  };

  const updateAmazonUrl = value => {
    const detected = extractAmazonAsin(value);
    setImporter(current => ({ ...current, amazonUrl:value }));
    setForm(current => ({
      ...current,
      source_url:value,
      affiliate_url:value || current.affiliate_url,
      asin:detected || current.asin
    }));
  };

  const reset = () => {
    setForm(initialForm);
    setFile(null);
    setPreview('');
    setMessage('');
    setImporter(initialImporter);
    setAiMessage('');
    setAmazonMessage('');
    setContentPackOpen(false);
  };

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    try {
      await signIn(email, password);
      setAuthenticated(true);
      await loadProducts();
    } catch (error) {
      setLoginError(error.message);
    }
  }

  function handleQueueProducts() {
    setQueueMessage('');
    const urls = bulkUrls.split('\n').map(url => url.trim()).filter(Boolean);
    if (!urls.length) return setQueueMessage('Paste at least one Amazon product URL.');

    const existingAsins = new Set(products.map(p => p.asin).filter(Boolean));
    const existingUrls = new Set(products.map(p => p.source_url).filter(Boolean));
    const queuedAsins = new Set(queue.map(item => item.asin).filter(Boolean));
    const queuedUrls = new Set(queue.map(item => item.url));
    let duplicates = 0;
    let invalid = 0;
    const newItems = [];

    [...new Set(urls)].forEach(url => {
      const detectedAsin = extractAmazonAsin(url);
      if (!detectedAsin) {
        invalid += 1;
        newItems.push({ id:crypto.randomUUID(), url, asin:'', status:'needs-review', note:'ASIN not detected' });
        return;
      }
      if (existingAsins.has(detectedAsin) || existingUrls.has(url) || queuedAsins.has(detectedAsin) || queuedUrls.has(url)) {
        duplicates += 1;
        return;
      }
      newItems.push({ id:crypto.randomUUID(), url, asin:detectedAsin, status:'queued', note:'' });
      queuedAsins.add(detectedAsin);
      queuedUrls.add(url);
    });

    setQueue(current => [...current, ...newItems]);
    setBulkUrls('');
    const parts = [];
    if (newItems.length) parts.push(`${newItems.length} queued`);
    if (duplicates) parts.push(`${duplicates} duplicate${duplicates === 1 ? '' : 's'} skipped`);
    if (invalid) parts.push(`${invalid} need review`);
    setQueueMessage(parts.join(' · ') || 'Nothing new was added.');
  }

  function loadQueueItem(item) {
    setImporter({ amazonUrl:item.url, title:'', features:'', category:'electronics' });
    setForm({ ...initialForm, asin:item.asin || '', source_url:item.url, affiliate_url:item.url });
    setFile(null);
    setPreview('');
    setQueue(current => current.map(q => q.id === item.id ? { ...q, status:'loaded', note:'Loaded into generator' } : q));
    setAmazonMessage('');
    setAiMessage('');
    setMessage('');
    setContentPackOpen(false);
    setTimeout(() => document.querySelector('.single-product-generator')?.scrollIntoView({behavior:'smooth'}), 0);
  }

  const queueCounts = useMemo(() => ({
    all: queue.length,
    queued: queue.filter(i => i.status === 'queued').length,
    loaded: queue.filter(i => i.status === 'loaded').length,
    'needs-review': queue.filter(i => i.status === 'needs-review').length
  }), [queue]);

  const filteredQueue = useMemo(() => queueFilter === 'all' ? queue : queue.filter(i => i.status === queueFilter), [queue, queueFilter]);

  async function handleAmazonFetch() {
    setAmazonLoading(true); setAmazonMessage('');
    try {
      const result = await fetchAmazonProduct(importer.amazonUrl);
      if (!result.available) { setAmazonMessage(result.reason); return; }
      const p = result.product;
      setImporter(current => ({ ...current, title:p.title || current.title, features:(p.features || []).join('\n') || current.features, category:p.category || current.category }));
      setForm(current => ({ ...current,
        title:p.title || current.title,
        asin:p.asin || current.asin,
        source_url:p.source_url || importer.amazonUrl || current.source_url,
        price:p.price !== '' && p.price != null ? String(p.price) : current.price,
        original_price:p.original_price !== '' && p.original_price != null ? String(p.original_price) : current.original_price,
        discount:calculateDiscount(
          p.original_price !== '' && p.original_price != null ? p.original_price : current.original_price,
          p.price !== '' && p.price != null ? p.price : current.price
        ) || p.discount || current.discount,
        rating:p.rating !== '' && p.rating != null ? String(p.rating) : current.rating,
        review_count:p.review_count || current.review_count,
        affiliate_url:p.affiliate_url || importer.amazonUrl || current.affiliate_url,
        image_url:p.image_url || current.image_url,
        specifications:p.specifications || current.specifications
      }));
      if (p.image_url) setPreview(p.image_url);
      setAmazonMessage('Amazon product data imported ✓ Now generate the bilingual AI content.');
    } catch (error) { setAmazonMessage(error.message); }
    finally { setAmazonLoading(false); }
  }

  async function handlePrepareAutomatically() {
    setAutoPreparing(true);
    setAmazonMessage('');
    setAiMessage('');

    try {
      const url = importer.amazonUrl.trim();
      if (!url) throw new Error('Paste an Amazon product URL first.');

      let sourceTitle = importer.title.trim();
      let sourceFeatures = importer.features.trim();
      let sourceCategory = importer.category;
      let amazonProduct = null;
      let amazonImported = false;

      // Always save the pasted Amazon affiliate URL immediately.
      setForm(current => ({
        ...current,
        source_url:url,
        affiliate_url:url,
        asin:extractAmazonAsin(url) || current.asin
      }));

      // Try the official Amazon function. If credentials are not active yet,
      // continue with the title/facts entered manually instead of stopping.
      try {
        const result = await fetchAmazonProduct(url);
        if (result?.available && result?.product) {
          amazonProduct = result.product;
          amazonImported = true;
          sourceTitle = amazonProduct.title || sourceTitle;
          sourceFeatures = (amazonProduct.features || []).join('\n') || sourceFeatures;
          sourceCategory = amazonProduct.category || sourceCategory;

          setImporter({
            amazonUrl:url,
            title:sourceTitle,
            features:sourceFeatures,
            category:sourceCategory
          });

          setForm(current => ({
            ...current,
            title:amazonProduct.title || current.title,
            asin:amazonProduct.asin || extractAmazonAsin(url) || current.asin,
            source_url:amazonProduct.source_url || url,
            price:amazonProduct.price !== '' && amazonProduct.price != null ? String(amazonProduct.price) : current.price,
            original_price:amazonProduct.original_price !== '' && amazonProduct.original_price != null ? String(amazonProduct.original_price) : current.original_price,
            discount:calculateDiscount(
              amazonProduct.original_price !== '' && amazonProduct.original_price != null ? amazonProduct.original_price : current.original_price,
              amazonProduct.price !== '' && amazonProduct.price != null ? amazonProduct.price : current.price
            ) || amazonProduct.discount || current.discount,
            rating:amazonProduct.rating !== '' && amazonProduct.rating != null ? String(amazonProduct.rating) : current.rating,
            review_count:amazonProduct.review_count || current.review_count,
            affiliate_url:amazonProduct.affiliate_url || url,
            image_url:amazonProduct.image_url || current.image_url,
            specifications:amazonProduct.specifications || current.specifications
          }));

          if (amazonProduct.image_url) setPreview(amazonProduct.image_url);
        }
      } catch (amazonError) {
        console.info('Amazon automatic import unavailable; using manual source facts.', amazonError);
      }

      if (!sourceTitle || !sourceFeatures) {
        throw new Error(
          'Amazon automatic data is not available yet. Add the product title and bullet points once, then click this button again.'
        );
      }

      const result = await generateProductContent({
        amazonUrl:url,
        title:sourceTitle,
        features:sourceFeatures,
        category:sourceCategory,
        price:amazonProduct?.price ?? form.price,
        originalPrice:amazonProduct?.original_price ?? form.original_price,
        rating:amazonProduct?.rating ?? form.rating,
        reviewCount:amazonProduct?.review_count ?? form.review_count
      });

      const p = result.data;
      setForm(current => ({
        ...current,
        title:p.title || sourceTitle || current.title,
        description:p.description || current.description,
        title_es:p.title_es || current.title_es,
        description_es:p.description_es || current.description_es,
        category:p.category || sourceCategory || current.category,
        asin:p.asin || amazonProduct?.asin || extractAmazonAsin(url) || current.asin,
        source_url:p.source_url || amazonProduct?.source_url || url,
        affiliate_url:amazonProduct?.affiliate_url || url,
        image_url:amazonProduct?.image_url || current.image_url,
        price:amazonProduct?.price !== '' && amazonProduct?.price != null ? String(amazonProduct.price) : current.price,
        original_price:amazonProduct?.original_price !== '' && amazonProduct?.original_price != null ? String(amazonProduct.original_price) : current.original_price,
        discount:calculateDiscount(
          amazonProduct?.original_price !== '' && amazonProduct?.original_price != null ? amazonProduct.original_price : current.original_price,
          amazonProduct?.price !== '' && amazonProduct?.price != null ? amazonProduct.price : current.price
        ) || amazonProduct?.discount || current.discount,
        rating:amazonProduct?.rating !== '' && amazonProduct?.rating != null ? String(amazonProduct.rating) : current.rating,
        review_count:amazonProduct?.review_count || current.review_count,
        long_description:p.long_description || '',
        long_description_es:p.long_description_es || '',
        seo_title:p.seo_title || '',
        seo_title_es:p.seo_title_es || '',
        meta_description:p.meta_description || '',
        meta_description_es:p.meta_description_es || '',
        keywords:arr(p.keywords),
        pros:arr(p.pros),
        cons:arr(p.cons),
        tags:arr(p.tags),
        specifications:{ ...(amazonProduct?.specifications || {}), ...(p.specifications || {}) }
      }));

      setContentPackOpen(true);
      setAiMessage(
        amazonImported
          ? 'Automatic preparation complete ✓ Amazon data + AI content are ready to review.'
          : 'AI preparation complete ✓ Affiliate link and ASIN were filled automatically. Add the remaining live Amazon fields manually until API access is active.'
      );
      setTimeout(() => document.querySelector('.product-form')?.scrollIntoView({ behavior:'smooth', block:'start' }), 150);
    } catch (error) {
      setAiMessage(error.message);
    } finally {
      setAutoPreparing(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true); setAiMessage('');
    try {
      const result = await generateProductContent({
        amazonUrl:importer.amazonUrl.trim(), title:importer.title.trim(), features:importer.features.trim(), category:importer.category,
        price:form.price, originalPrice:form.original_price, rating:form.rating, reviewCount:form.review_count
      });
      const p = result.data;
      setForm(current => ({ ...current,
        title:p.title || current.title,
        description:p.description || current.description,
        title_es:p.title_es || current.title_es,
        description_es:p.description_es || current.description_es,
        category:p.category || importer.category || current.category,
        asin:p.asin || asin || current.asin,
        source_url:p.source_url || importer.amazonUrl || current.source_url,
        long_description:p.long_description || '', long_description_es:p.long_description_es || '',
        seo_title:p.seo_title || '', seo_title_es:p.seo_title_es || '',
        meta_description:p.meta_description || '', meta_description_es:p.meta_description_es || '',
        keywords:arr(p.keywords), pros:arr(p.pros), cons:arr(p.cons), tags:arr(p.tags), specifications:p.specifications || {}
      }));
      setContentPackOpen(true);
      setAiMessage(result.demo ? 'Demo content generated ✓ Connect the Supabase AI function for real AI generation.' : 'AI content generated ✓ Review it, add the official Amazon image/link, then publish.');
      setTimeout(() => document.querySelector('.product-form')?.scrollIntoView({ behavior:'smooth', block:'start' }), 150);
    } catch (error) { setAiMessage(error.message); }
    finally { setGenerating(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setMessage('');
    try {
      if (!file && !form.image_url) throw new Error('Please upload a product image. Amazon images will import automatically once API access is active.');

      if (!form.id) {
        const duplicate = products.find(product =>
          (form.asin && product.asin && product.asin === form.asin) ||
          (form.source_url && product.source_url && product.source_url === form.source_url)
        );
        if (duplicate) throw new Error(`This product is already published: ${duplicate.title}`);
      }

      const computedDiscount = calculateDiscount(form.original_price, form.price);
      const payload = {
        id:form.id || undefined, title:form.title.trim(), description:form.description.trim(),
        title_es:form.title_es.trim() || null, description_es:form.description_es.trim() || null,
        category:form.category, rating:Number(form.rating), price:Number(form.price),
        original_price:form.original_price ? Number(form.original_price) : null,
        review_count:form.review_count.trim(), discount:computedDiscount || form.discount.trim(),
        discount_ends_at:form.discount_ends_at ? new Date(form.discount_ends_at).toISOString() : null,
        affiliate_url:form.affiliate_url.trim(), image_url:form.image_url.trim(), is_active:form.is_active, sort_order:0,
        asin:form.asin || null, source_url:form.source_url || null,
        long_description:form.long_description || null, long_description_es:form.long_description_es || null,
        seo_title:form.seo_title || null, seo_title_es:form.seo_title_es || null,
        meta_description:form.meta_description || null, meta_description_es:form.meta_description_es || null,
        keywords:arr(form.keywords), pros:arr(form.pros), cons:arr(form.cons), tags:arr(form.tags), specifications:form.specifications || {}
      };
      await saveProduct(payload, file);
      setQueue(current => current.map(item => ((payload.asin && item.asin === payload.asin) || item.url === payload.source_url) ? { ...item, status:'published', note:'Published' } : item));
      reset();
      await loadProducts();
      setMessage('Product published successfully ✓ Ready for the next product.');

      setTimeout(() => {
        const generator = document.querySelector('.single-product-generator');
        generator?.scrollIntoView({ behavior:'smooth', block:'start' });

        setTimeout(() => {
          const amazonUrlInput = generator?.querySelector('input[type="url"]');
          amazonUrlInput?.focus({ preventScroll:true });
        }, 450);
      }, 200);
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  }

  function editProduct(product) {
    setForm({ ...initialForm, ...product,
      id:product.id, title:product.title, description:product.description, title_es:product.title_es || '', description_es:product.description_es || '',
      category:product.category, rating:String(product.rating ?? 4.8), price:String(product.price ?? ''),
      original_price:product.original_price ? String(product.original_price) : '', review_count:product.review_count || '', discount:product.discount || '',
      discount_ends_at:toLocalDateTime(product.discount_ends_at), affiliate_url:product.affiliate_url || '', image_url:product.image_url || '', is_active:product.is_active !== false,
      keywords:arr(product.keywords), pros:arr(product.pros), cons:arr(product.cons), tags:arr(product.tags), specifications:product.specifications || {}
    });

    setImporter({
      amazonUrl:product.source_url || '',
      title:product.title || '',
      features:product.long_description || product.description || '',
      category:product.category || 'electronics'
    });

    setPreview(product.image_url || '');
    setFile(null);
    setMessage('Editing product — review your changes, then click Save changes.');
    setContentPackOpen(Boolean(product.seo_title));

    setTimeout(() => {
      const formEl = document.querySelector('.product-form');
      formEl?.scrollIntoView({ behavior:'smooth', block:'start' });

      setTimeout(() => {
        const titleInput = formEl?.querySelector('input[placeholder="Wireless Earbuds"]');
        titleInput?.focus({ preventScroll:true });
        titleInput?.select();
      }, 450);
    }, 50);
  }

  if (checking) return <main><div className="login-card">Loading…</div></main>;

  return <>
    <header>
      <a className="admin-logo" href="index.html"><span>EZ</span>COMPRA <b>ADMIN</b></a>
      <div><span id="modeBadge">{cloudReady ? 'CLOUD' : 'LOCAL DEMO'}</span>{authenticated && cloudReady && <button className="text-button" onClick={async () => { await signOut(); location.reload(); }}>Log out</button>}</div>
    </header>
    <main>
      {!authenticated ? <section className="login-card"><span className="mini-label">PRIVATE DASHBOARD</span><h1>Welcome back</h1><p>Sign in to manage EZCOMPRA products.</p><form onSubmit={handleLogin}><label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button>Sign in</button><p className="error">{loginError}</p></form></section> :
      <section>
        <div className="dashboard-title"><div><span className="mini-label">EZCOMPRA · LAUNCH CONTROL</span><h1>Your daily deals</h1><p>Queue products in bulk, prepare them with AI, review, and publish.</p></div><a href="index.html" target="_blank" className="preview-button">Preview website ↗</a></div>
        {!cloudReady && <div className="notice"><strong>Local preview mode:</strong> Product publishing works locally. Connect Supabase + the AI Edge Function for the live cloud workflow.</div>}

        <section className="ai-importer pipeline-combined">
          <div className="pipeline-block queue-block">
            <div className="ai-importer-heading">
              <div>
                <span className="ai-spark">🚀</span>
                <div>
                  <span className="mini-label">PRODUCT PIPELINE</span>
                  <h2>Queue Amazon products</h2>
                </div>
              </div>
              <span className="phase-chip">{queue.length} in queue</span>
            </div>

            <label>
              Amazon URLs — one per line
              <textarea
                className="source-facts"
                value={bulkUrls}
                onChange={e=>setBulkUrls(e.target.value)}
                placeholder={'https://www.amazon.com/dp/B0...\nhttps://www.amazon.com/dp/B0...\nhttps://www.amazon.com/dp/B0...'}
              />
            </label>

            <button type="button" className="generate-button" onClick={handleQueueProducts} disabled={!bulkUrls.trim()}>
              🚀 Queue Products
            </button>

            {queueMessage && <p className="ai-message">{queueMessage}</p>}

            {queue.length > 0 && (
              <div className="content-pack queue-results">
                <div className="content-pack-body">
                  <div className="queue-filter-row">
                    {['all','queued','loaded','needs-review'].map(value => (
                      <button
                        key={value}
                        type="button"
                        className={queueFilter===value?'publish-button':'cancel-button'}
                        onClick={()=>setQueueFilter(value)}
                      >
                        {value==='all'
                          ? `All (${queueCounts.all})`
                          : value==='queued'
                            ? `Queued (${queueCounts.queued})`
                            : value==='loaded'
                              ? `Loaded (${queueCounts.loaded})`
                              : `Needs review (${queueCounts['needs-review']})`}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="cancel-button clear-finished-button"
                      onClick={()=>setQueue(current=>current.filter(i=>!['loaded','published'].includes(i.status)))}
                    >
                      Clear finished
                    </button>
                  </div>

                  <div className="admin-product-list queue-product-list">
                    {filteredQueue.length ? filteredQueue.map((item,index)=>(
                      <article className="admin-item" key={item.id}>
                        <div className="queue-item-copy">
                          <h3>{item.asin?`ASIN ${item.asin}`:`Product ${index+1}`}</h3>
                          <p>{item.url}</p>
                          <small>Status: {item.status}{item.note?` · ${item.note}`:''}</small>
                        </div>
                        <div className="item-actions">
                          <button type="button" onClick={()=>loadQueueItem(item)} disabled={!item.asin}>Load</button>
                          <button type="button" className="delete" onClick={()=>setQueue(current=>current.filter(q=>q.id!==item.id))}>Remove</button>
                        </div>
                      </article>
                    )) : (
                      <div className="empty-list">No products in this queue view.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pipeline-divider">
            <span>OR PREPARE ONE PRODUCT</span>
          </div>

          <div className="pipeline-block single-product-generator">
            <div className="ai-importer-heading">
              <div>
                <span className="ai-spark">✦</span>
                <div>
                  <span className="mini-label">AMAZON + AI PIPELINE</span>
                  <h2>Prepare one queued product</h2>
                </div>
              </div>
              <span className="phase-chip">Amazon-ready</span>
            </div>

            <div className="ai-url-row">
              <label>
                Amazon product URL
                <input
                  type="url"
                  value={importer.amazonUrl}
                  onChange={e=>updateAmazonUrl(e.target.value)}
                  placeholder="https://www.amazon.com/dp/B0..."
                />
              </label>

              <div className={`asin-box ${asin?'found':''}`}>
                <small>ASIN</small>
                <strong>{asin || 'Auto-detect'}</strong>
              </div>
            </div>

            {existingProduct && !form.id && (
              <div className="phase-note duplicate-warning">
                <strong>Already published:</strong> {existingProduct.title}
                <button type="button" className="cancel-button" onClick={()=>editProduct(existingProduct)}>
                  Edit existing product
                </button>
              </div>
            )}

            <button
              type="button"
              className="amazon-fetch-button"
              onClick={handleAmazonFetch}
              disabled={amazonLoading || !asin || Boolean(existingProduct && !form.id)}
            >
              {amazonLoading?'Connecting to Amazon…':'↓ Import official Amazon data'}
            </button>

            {amazonMessage && <p className="amazon-message">{amazonMessage}</p>}

            <div className="ai-source-grid">
              <label>
                Amazon product title
                <input
                  value={importer.title}
                  onChange={e=>updateImporter('title',e.target.value)}
                  placeholder="Roborock Q10 S5+ Robot Vacuum and Mop"
                />
              </label>

              <label>
                Category
                <select value={importer.category} onChange={e=>updateImporter('category',e.target.value)}>
                  <option value="electronics">Tech</option>
                  <option value="home">Home</option>
                  <option value="beauty">Beauty</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="fitness">Fitness</option>
                  <option value="pets">Pets</option>
                </select>
              </label>
            </div>

            <label>
              Amazon bullet points / product facts
              <textarea
                className="source-facts"
                value={importer.features}
                onChange={e=>updateImporter('features',e.target.value)}
                placeholder={'Paste the main Amazon facts here for now, for example:\n• 10,000Pa suction\n• 70-day self-emptying\n• Sonic mopping\n• Obstacle avoidance'}
              />
            </label>

            <div className="phase-note">
              <strong>Ready for Amazon Creators API:</strong> until your credentials are approved, use the manual title/facts. Once credentials are added, the Import button fills official product data without changing this workflow.
            </div>

            <button
              type="button"
              className="generate-button"
              onClick={handlePrepareAutomatically}
              disabled={autoPreparing || generating || Boolean(existingProduct && !form.id)}
            >
              {autoPreparing ? '✨ Preparing product automatically…' : '✨ Prepare Product Automatically'}
            </button>

            <button
              type="button"
              className="cancel-button ai-fallback-button"
              onClick={handleGenerate}
              disabled={generating || autoPreparing}
            >
              {generating ? '✦ Generating English + Spanish…' : 'AI only (manual fallback)'}
            </button>

            {aiMessage && <p className="ai-message">{aiMessage}</p>}
          </div>
        </section>

        <div className="admin-grid">
          <form className={`product-form ${form.id ? 'editing-product' : ''}`} onSubmit={handleSubmit}><h2>{form.id?'Edit product':'Review & publish'}</h2>
            <div className="image-source-card">
              <div className="image-source-heading">
                <div>
                  <strong>Product image</strong>
                  <span>Upload a file or paste an image URL</span>
                </div>
                {preview && <button type="button" className="image-clear-button" onClick={()=>{setFile(null);setPreview('');update('image_url','');}}>Clear image</button>}
              </div>

              <label className="image-upload-label">
                Upload image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e=>{
                    const selected=e.target.files[0]||null;
                    setFile(selected);
                    if(selected){
                      setPreview(URL.createObjectURL(selected));
                    }
                  }}
                />
              </label>

              <label>
                Image URL
                <input
                  type="url"
                  value={form.image_url || ''}
                  onChange={e=>{
                    const value=e.target.value;
                    update('image_url',value);
                    setFile(null);
                    setPreview(value);
                  }}
                  placeholder="https://images.example.com/product.jpg"
                />
              </label>

              <div className={`image-preview ${preview ? 'has-image' : ''}`}>
                {preview
                  ? <img src={preview} alt="Product preview" onError={e=>{e.currentTarget.style.display='none';}}/>
                  : <span>Image preview · The full product will stay centered inside this box</span>}
              </div>

              <p className="image-preview-note">Preview uses the same “show the whole product” style we’ll apply to the storefront cards.</p>
            </div>
            <label>Title<input maxLength="140" required value={form.title} onChange={e=>update('title',e.target.value)} placeholder="Wireless Earbuds"/></label>
            <label>Quick description<textarea maxLength="220" required value={form.description} onChange={e=>update('description',e.target.value)} placeholder="Noise control · 24-hour playtime"/></label>
            <label>Spanish title <span className="field-note">AI generated</span><input maxLength="140" value={form.title_es} onChange={e=>update('title_es',e.target.value)} placeholder="Audífonos inalámbricos"/></label>
            <label>Spanish quick description <span className="field-note">AI generated</span><textarea maxLength="220" value={form.description_es} onChange={e=>update('description_es',e.target.value)} placeholder="Control de ruido · 24 horas de batería"/></label>
            <div className="two-fields"><label>Category<select value={form.category} onChange={e=>update('category',e.target.value)}><option value="electronics">Tech</option><option value="home">Home</option><option value="beauty">Beauty</option><option value="lifestyle">Lifestyle</option><option value="fitness">Fitness</option></select></label><label>Rating<input type="number" min="0" max="5" step="0.1" required value={form.rating} onChange={e=>update('rating',e.target.value)}/></label></div>
            <div className="two-fields">
              <label>Original price<input type="number" min="0" step="0.01" value={form.original_price} onChange={e=>updateOriginalPrice(e.target.value)} placeholder="29.99"/></label>
              <label>Deal price<input type="number" min="0" step="0.01" required value={form.price} onChange={e=>updateDealPrice(e.target.value)} placeholder="19.99"/></label>
            </div>
            <div className="two-fields">
              <label>Review count<input value={form.review_count} onChange={e=>update('review_count',e.target.value)} placeholder="1,245"/></label>
              <label>Discount badge <span className="field-note">Automatic</span><input value={calculateDiscount(form.original_price, form.price) || form.discount} readOnly placeholder="Calculated automatically"/></label>
            </div>
            {priceSavings(form.original_price, form.price) && <div className="phase-note"><strong>Save ${priceSavings(form.original_price, form.price)}</strong> · {calculateDiscount(form.original_price, form.price).replace('-', '')} OFF</div>}
            <label>Discount expiration <span className="field-note">Private — visitors will not see this date</span><input type="datetime-local" value={form.discount_ends_at} onChange={e=>update('discount_ends_at',e.target.value)}/></label>
            <label>Affiliate link<input type="url" required value={form.affiliate_url} onChange={e=>update('affiliate_url',e.target.value)} placeholder="https://..."/></label>
            {(form.seo_title || form.long_description) && <div className="content-pack"><button type="button" className="content-pack-toggle" onClick={()=>setContentPackOpen(v=>!v)}><span>✦ AI Content Pack</span><span>{contentPackOpen?'−':'+'}</span></button>{contentPackOpen && <div className="content-pack-body"><label>SEO title<input value={form.seo_title} onChange={e=>update('seo_title',e.target.value)}/></label><label>SEO title — Spanish<input value={form.seo_title_es} onChange={e=>update('seo_title_es',e.target.value)}/></label><label>Meta description<textarea value={form.meta_description} onChange={e=>update('meta_description',e.target.value)}/></label><label>Meta description — Spanish<textarea value={form.meta_description_es} onChange={e=>update('meta_description_es',e.target.value)}/></label><label>Long description<textarea className="long-text" value={form.long_description} onChange={e=>update('long_description',e.target.value)}/></label><label>Long description — Spanish<textarea className="long-text" value={form.long_description_es} onChange={e=>update('long_description_es',e.target.value)}/></label><div className="ai-list-preview"><div><strong>Keywords</strong><p>{arr(form.keywords).join(' · ') || '—'}</p></div><div><strong>Pros</strong><p>{arr(form.pros).join(' · ') || '—'}</p></div><div><strong>Cons</strong><p>{arr(form.cons).join(' · ') || '—'}</p></div></div></div>}</div>}
            <label className="check"><input type="checkbox" checked={form.is_active} onChange={e=>update('is_active',e.target.checked)}/> Show this product on the website</label>
            <div className="form-actions"><button className="publish-button" disabled={saving}>{saving?'Publishing…':form.id?'Save changes':'Publish product'}</button>{form.id && <button type="button" className="cancel-button" onClick={reset}>Cancel edit</button>}</div><p id="formMessage">{message}</p>
          </form>

          <section className="product-list-shell">
            <div className="list-heading">
              <div>
                <h2>Published products</h2>
                <span>{filteredProducts.length} of {products.length} product{products.length===1?'':'s'}</span>
              </div>
            </div>

            <div className="catalog-tools">
              <input
                type="search"
                value={productSearch}
                onChange={e=>setProductSearch(e.target.value)}
                placeholder="Search title, ASIN, or category..."
              />
              <select value={productCategory} onChange={e=>setProductCategory(e.target.value)}>
                <option value="all">All categories</option>
                <option value="electronics">Tech</option>
                <option value="home">Home</option>
                <option value="beauty">Beauty</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="fitness">Fitness</option>
                <option value="pets">Pets</option>
              </select>
              <select value={productStatus} onChange={e=>setProductStatus(e.target.value)}>
                <option value="all">All status</option>
                <option value="live">Live</option>
                <option value="hidden">Hidden</option>
              </select>
              <select value={productSort} onChange={e=>setProductSort(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="discount">Biggest discount</option>
                <option value="rating">Highest rating</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </div>

            <div className="admin-product-list">
              {filteredProducts.length ? filteredProducts.map(p => (
                <article className="admin-item" key={p.id}>
                  <img src={p.image_url} alt=""/>
                  <div>
                    <h3>{p.title}</h3>
                    <p>${Number(p.price).toFixed(2)} · {p.category} · {p.is_active===false?'Hidden':'Live'}</p>
                    {p.asin && <small>ASIN {p.asin}</small>}
                  </div>
                  <div className="item-actions">
                    <button type="button" onClick={()=>editProduct(p)}>Edit</button>
                    <button
                      type="button"
                      className="delete"
                      onClick={async()=>{
                        if(confirm('Delete this product?')){
                          await deleteProduct(p.id);
                          await loadProducts();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )) : (
                <div className="empty-list">No products match your filters.</div>
              )}
            </div>
          </section>
        </div>
      </section>}
    </main>
  </>;
}