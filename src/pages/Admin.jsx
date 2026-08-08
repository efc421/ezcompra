import React, { useEffect, useMemo, useState } from 'react';
import { cloudReady, deleteProduct, getAllProducts, saveProduct, session, signIn, signOut } from '../services/data.js';
import { extractAmazonAsin, generateProductContent } from '../services/ai.js';
import { fetchAmazonProduct } from '../services/amazon.js';
import '../styles/admin.css';
import '../styles/discount-automation.css';

const initialForm = {
  id:'', title:'', description:'', title_es:'', description_es:'', category:'electronics', rating:'4.8', price:'', original_price:'', review_count:'', discount:'', discount_ends_at:'', affiliate_url:'', image_url:'', is_active:true,
  asin:'', source_url:'', long_description:'', long_description_es:'', seo_title:'', seo_title_es:'', meta_description:'', meta_description_es:'', keywords:[], pros:[], cons:[], tags:[], specifications:{}
};
const initialImporter = { amazonUrl:'', title:'', features:'', category:'electronics' };
const toLocalDateTime = value => { if (!value) return ''; const date = new Date(value); const offset = date.getTimezoneOffset()*60000; return new Date(date-offset).toISOString().slice(0,16); };
const arr = value => Array.isArray(value) ? value : [];

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

  const asin = useMemo(() => extractAmazonAsin(importer.amazonUrl), [importer.amazonUrl]);
  const loadProducts = async () => setProducts(await getAllProducts());
  useEffect(() => { session().then(s => { setAuthenticated(Boolean(s)); setChecking(false); if (s) loadProducts(); }); }, []);
  const update = (name, value) => setForm(current => ({ ...current, [name]: value }));
  const updateImporter = (name, value) => setImporter(current => ({ ...current, [name]: value }));
  const reset = () => { setForm(initialForm); setFile(null); setPreview(''); setMessage(''); setImporter(initialImporter); setAiMessage(''); setAmazonMessage(''); setContentPackOpen(false); };

  async function handleLogin(e) {
    e.preventDefault(); setLoginError('');
    try { await signIn(email, password); setAuthenticated(true); await loadProducts(); }
    catch (error) { setLoginError(error.message); }
  }

  async function handleAmazonFetch() {
    setAmazonLoading(true); setAmazonMessage('');
    try {
      const result = await fetchAmazonProduct(importer.amazonUrl);
      if (!result.available) { setAmazonMessage(result.reason); return; }
      const p = result.product;
      setImporter(current => ({
        ...current,
        title: p.title || current.title,
        features: (p.features || []).join('\n') || current.features,
        category: p.category || current.category
      }));
      setForm(current => ({
        ...current,
        title: p.title || current.title,
        asin: p.asin || current.asin,
        source_url: p.source_url || importer.amazonUrl || current.source_url,
        price: p.price !== '' && p.price != null ? String(p.price) : current.price,
        original_price: p.original_price !== '' && p.original_price != null ? String(p.original_price) : current.original_price,
        discount: p.discount || current.discount,
        rating: p.rating !== '' && p.rating != null ? String(p.rating) : current.rating,
        review_count: p.review_count || current.review_count,
        affiliate_url: p.affiliate_url || current.affiliate_url,
        image_url: p.image_url || current.image_url,
        specifications: p.specifications || current.specifications
      }));
      if (p.image_url) setPreview(p.image_url);
      setAmazonMessage('Amazon product data imported ✓ Now generate the bilingual AI content.');
    } catch (error) { setAmazonMessage(error.message); }
    finally { setAmazonLoading(false); }
  }

  async function handleGenerate() {
    setGenerating(true); setAiMessage('');
    try {
      const result = await generateProductContent({
        amazonUrl: importer.amazonUrl.trim(), title: importer.title.trim(), features: importer.features.trim(), category: importer.category,
        price: form.price, originalPrice: form.original_price, rating: form.rating, reviewCount: form.review_count
      });
      const p = result.data;
      setForm(current => ({
        ...current,
        title: p.title || current.title,
        description: p.description || current.description,
        title_es: p.title_es || current.title_es,
        description_es: p.description_es || current.description_es,
        category: p.category || importer.category || current.category,
        asin: p.asin || asin || current.asin,
        source_url: p.source_url || importer.amazonUrl || current.source_url,
        long_description: p.long_description || '',
        long_description_es: p.long_description_es || '',
        seo_title: p.seo_title || '', seo_title_es: p.seo_title_es || '',
        meta_description: p.meta_description || '', meta_description_es: p.meta_description_es || '',
        keywords: arr(p.keywords), pros: arr(p.pros), cons: arr(p.cons), tags: arr(p.tags), specifications: p.specifications || {}
      }));
      setContentPackOpen(true);
      setAiMessage(result.demo ? 'Demo content generated ✓ Connect the Supabase AI function for real AI generation.' : 'AI content generated ✓ Review it, add the official Amazon image/link, then publish.');
    } catch (error) { setAiMessage(error.message); }
    finally { setGenerating(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setMessage('');
    try {
      if (!file && !form.image_url) throw new Error('Please upload a product image. Phase 3 will import Amazon images automatically.');
      const payload = {
        id: form.id || undefined, title: form.title.trim(), description: form.description.trim(),
        title_es: form.title_es.trim() || null, description_es: form.description_es.trim() || null,
        category: form.category, rating: Number(form.rating), price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        review_count: form.review_count.trim(), discount: form.discount.trim(),
        discount_ends_at: form.discount_ends_at ? new Date(form.discount_ends_at).toISOString() : null,
        affiliate_url: form.affiliate_url.trim(), image_url: form.image_url.trim(), is_active: form.is_active, sort_order: 0,
        asin: form.asin || null, source_url: form.source_url || null,
        long_description: form.long_description || null, long_description_es: form.long_description_es || null,
        seo_title: form.seo_title || null, seo_title_es: form.seo_title_es || null,
        meta_description: form.meta_description || null, meta_description_es: form.meta_description_es || null,
        keywords: arr(form.keywords), pros: arr(form.pros), cons: arr(form.cons), tags: arr(form.tags), specifications: form.specifications || {}
      };
      await saveProduct(payload, file);
      setMessage('Product published successfully ✓');
      reset(); await loadProducts();
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  }

  function editProduct(product) {
    setForm({
      ...initialForm, ...product,
      id:product.id,title:product.title,description:product.description,title_es:product.title_es||'',description_es:product.description_es||'',category:product.category,rating:String(product.rating ?? 4.8),price:String(product.price ?? ''),original_price:product.original_price ? String(product.original_price) : '',review_count:product.review_count||'',discount:product.discount||'',discount_ends_at:toLocalDateTime(product.discount_ends_at),affiliate_url:product.affiliate_url||'',image_url:product.image_url||'',is_active:product.is_active !== false,
      keywords:arr(product.keywords),pros:arr(product.pros),cons:arr(product.cons),tags:arr(product.tags),specifications:product.specifications||{}
    });
    setImporter({amazonUrl:product.source_url||'',title:product.title||'',features:product.long_description||product.description||'',category:product.category||'electronics'});
    setPreview(product.image_url || ''); setFile(null); setMessage(''); setContentPackOpen(Boolean(product.seo_title)); window.scrollTo({top:0,behavior:'smooth'});
  }

  if (checking) return <main><div className="login-card">Loading…</div></main>;
  return <>
    <header><a className="admin-logo" href="index.html"><span>EZ</span>COMPRA <b>ADMIN</b></a><div><span id="modeBadge">{cloudReady ? 'CLOUD' : 'LOCAL DEMO'}</span>{authenticated && cloudReady && <button className="text-button" onClick={async () => { await signOut(); location.reload(); }}>Log out</button>}</div></header>
    <main>
      {!authenticated ? <section className="login-card"><span className="mini-label">PRIVATE DASHBOARD</span><h1>Welcome back</h1><p>Sign in to manage EZCOMPRA products.</p><form onSubmit={handleLogin}><label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button>Sign in</button><p className="error">{loginError}</p></form></section> :
      <section>
        <div className="dashboard-title"><div><span className="mini-label">PHASE 3 · AMAZON-READY IMPORTER</span><h1>Your daily deals</h1><p>One product pipeline for manual input today and Amazon Creators API tomorrow.</p></div><a href="index.html" target="_blank" className="preview-button">Preview website ↗</a></div>
        {!cloudReady && <div className="notice"><strong>Local preview mode:</strong> The generator uses a safe demo template. Connect Supabase + the Edge Function to activate real AI.</div>}

        <section className="ai-importer">
          <div className="ai-importer-heading"><div><span className="ai-spark">✦</span><div><span className="mini-label">AMAZON + AI PIPELINE</span><h2>Generate from an Amazon product</h2></div></div><span className="phase-chip">Phase 3 ready</span></div>
          <div className="ai-url-row"><label>Amazon product URL<input type="url" value={importer.amazonUrl} onChange={e=>updateImporter('amazonUrl',e.target.value)} placeholder="https://www.amazon.com/dp/B0..."/></label><div className={`asin-box ${asin?'found':''}`}><small>ASIN</small><strong>{asin || 'Auto-detect'}</strong></div></div>
          <button type="button" className="amazon-fetch-button" onClick={handleAmazonFetch} disabled={amazonLoading || !asin}>{amazonLoading ? 'Connecting to Amazon…' : '↓ Import official Amazon data'}</button>
          {amazonMessage && <p className="amazon-message">{amazonMessage}</p>}
          <div className="ai-source-grid"><label>Amazon product title<input value={importer.title} onChange={e=>updateImporter('title',e.target.value)} placeholder="Roborock Q10 S5+ Robot Vacuum and Mop"/></label><label>Category<select value={importer.category} onChange={e=>updateImporter('category',e.target.value)}><option value="electronics">Tech</option><option value="home">Home</option><option value="beauty">Beauty</option><option value="lifestyle">Lifestyle</option><option value="fitness">Fitness</option></select></label></div>
          <label>Amazon bullet points / product facts<textarea className="source-facts" value={importer.features} onChange={e=>updateImporter('features',e.target.value)} placeholder={'Paste the main Amazon facts here for now, for example:\n• 10,000Pa suction\n• 70-day self-emptying\n• Sonic mopping\n• Obstacle avoidance'}/></label>
          <div className="phase-note"><strong>Built for Amazon's current Creators API:</strong> until your credentials are approved, keep using the manual title/facts below. Once credentials are added, the Import button fills official Amazon data without changing this admin screen.</div>
          <button type="button" className="generate-button" onClick={handleGenerate} disabled={generating}>{generating ? '✦ Generating English + Spanish…' : '✦ Generate Product with AI'}</button>
          {aiMessage && <p className="ai-message">{aiMessage}</p>}
        </section>

        <div className="admin-grid">
          <form className="product-form" onSubmit={handleSubmit}><h2>{form.id ? 'Edit product' : 'Review & publish'}</h2>
            <label>Product image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const selected=e.target.files[0]||null;setFile(selected);if(selected)setPreview(URL.createObjectURL(selected));}}/></label><div className="image-preview" style={preview?{backgroundImage:`url("${preview}")`}:{}}>{preview?'':'Image preview · Phase 3 will import this'}</div>
            <label>Title<input maxLength="140" required value={form.title} onChange={e=>update('title',e.target.value)} placeholder="Wireless Earbuds"/></label>
            <label>Quick description<textarea maxLength="220" required value={form.description} onChange={e=>update('description',e.target.value)} placeholder="Noise control · 24-hour playtime"/></label>
            <label>Spanish title <span className="field-note">AI generated</span><input maxLength="140" value={form.title_es} onChange={e=>update('title_es',e.target.value)} placeholder="Audífonos inalámbricos"/></label>
            <label>Spanish quick description <span className="field-note">AI generated</span><textarea maxLength="220" value={form.description_es} onChange={e=>update('description_es',e.target.value)} placeholder="Control de ruido · 24 horas de batería"/></label>
            <div className="two-fields"><label>Category<select value={form.category} onChange={e=>update('category',e.target.value)}><option value="electronics">Tech</option><option value="home">Home</option><option value="beauty">Beauty</option><option value="lifestyle">Lifestyle</option><option value="fitness">Fitness</option></select></label><label>Rating<input type="number" min="0" max="5" step="0.1" required value={form.rating} onChange={e=>update('rating',e.target.value)}/></label></div>
            <div className="two-fields"><label>Deal price<input type="number" min="0" step="0.01" required value={form.price} onChange={e=>update('price',e.target.value)} placeholder="19.99"/></label><label>Original price<input type="number" min="0" step="0.01" value={form.original_price} onChange={e=>update('original_price',e.target.value)} placeholder="29.99"/></label></div>
            <div className="two-fields"><label>Review count<input value={form.review_count} onChange={e=>update('review_count',e.target.value)} placeholder="1,245"/></label><label>Discount badge<input value={form.discount} onChange={e=>update('discount',e.target.value)} placeholder="-32%"/></label></div>
            <label>Discount expiration <span className="field-note">Private — visitors will not see this date</span><input type="datetime-local" value={form.discount_ends_at} onChange={e=>update('discount_ends_at',e.target.value)}/></label>
            <label>Affiliate link<input type="url" required value={form.affiliate_url} onChange={e=>update('affiliate_url',e.target.value)} placeholder="https://..."/></label>
            {(form.id || form.image_url) && <label>Existing image URL<input type="url" value={form.image_url} onChange={e=>{update('image_url',e.target.value);setPreview(e.target.value);}} placeholder="https://..."/></label>}

            {(form.seo_title || form.long_description) && <div className="content-pack">
              <button type="button" className="content-pack-toggle" onClick={()=>setContentPackOpen(v=>!v)}><span>✦ AI Content Pack</span><span>{contentPackOpen?'−':'+'}</span></button>
              {contentPackOpen && <div className="content-pack-body">
                <label>SEO title<input value={form.seo_title} onChange={e=>update('seo_title',e.target.value)}/></label>
                <label>SEO title — Spanish<input value={form.seo_title_es} onChange={e=>update('seo_title_es',e.target.value)}/></label>
                <label>Meta description<textarea value={form.meta_description} onChange={e=>update('meta_description',e.target.value)}/></label>
                <label>Meta description — Spanish<textarea value={form.meta_description_es} onChange={e=>update('meta_description_es',e.target.value)}/></label>
                <label>Long description<textarea className="long-text" value={form.long_description} onChange={e=>update('long_description',e.target.value)}/></label>
                <label>Long description — Spanish<textarea className="long-text" value={form.long_description_es} onChange={e=>update('long_description_es',e.target.value)}/></label>
                <div className="ai-list-preview"><div><strong>Keywords</strong><p>{arr(form.keywords).join(' · ') || '—'}</p></div><div><strong>Pros</strong><p>{arr(form.pros).join(' · ') || '—'}</p></div><div><strong>Cons</strong><p>{arr(form.cons).join(' · ') || '—'}</p></div></div>
              </div>}
            </div>}

            <label className="check"><input type="checkbox" checked={form.is_active} onChange={e=>update('is_active',e.target.checked)}/> Show this product on the website</label>
            <div className="form-actions"><button className="publish-button" disabled={saving}>{saving?'Publishing…':form.id?'Save changes':'Publish product'}</button>{form.id && <button type="button" className="cancel-button" onClick={reset}>Cancel edit</button>}</div><p id="formMessage">{message}</p>
          </form>
          <section className="product-list-shell"><div className="list-heading"><h2>Published products</h2><span>{products.length} product{products.length===1?'':'s'}</span></div><div className="admin-product-list">{products.length?products.map(p=><article className="admin-item" key={p.id}><img src={p.image_url} alt=""/><div><h3>{p.title}</h3><p>${Number(p.price).toFixed(2)} · {p.category} · {p.is_active===false?'Hidden':'Live'}</p>{p.asin && <small>ASIN {p.asin}</small>}</div><div className="item-actions"><button type="button" onClick={()=>editProduct(p)}>Edit</button><button type="button" className="delete" onClick={async()=>{if(confirm('Delete this product?')){await deleteProduct(p.id);await loadProducts();}}}>Delete</button></div></article>):<div className="empty-list">No products yet. Add your first one.</div>}</div></section>
        </div>
      </section>}
    </main>
  </>;
}
