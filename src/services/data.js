const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const cloudReady = /^https:\/\/.+\.supabase\.co$/.test(supabaseUrl) && Boolean(supabaseAnonKey);
export const client = cloudReady && window.supabase ? window.supabase.createClient(supabaseUrl, supabaseAnonKey) : null;

const storageKey = 'ezcompra-products-v2';
const defaults = [
  {id:'demo-1',title:'Wireless Earbuds',description:'Noise control · 24-hour playtime',title_es:'Audífonos inalámbricos',description_es:'Control de ruido · 24 horas de batería',category:'electronics',rating:4.6,review_count:'1,245',price:18.99,original_price:27.99,discount:'-32%',image_url:'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=85',affiliate_url:'https://example.com/affiliate-1',sort_order:1,is_active:true},
  {id:'demo-2',title:'LED Bedside Lamp',description:'Dimmable · Touch control',title_es:'Lámpara LED de noche',description_es:'Regulable · Control táctil',category:'home',rating:4.7,review_count:'982',price:14.99,original_price:19.99,discount:'-25%',image_url:'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85',affiliate_url:'https://example.com/affiliate-2',sort_order:2,is_active:true},
  {id:'demo-3',title:'Portable Blender',description:'USB rechargeable · 380ml',title_es:'Licuadora portátil',description_es:'Recargable por USB · 380 ml',category:'lifestyle',rating:4.5,review_count:'756',price:23.99,original_price:29.99,discount:'-20%',image_url:'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=900&q=85',affiliate_url:'https://example.com/affiliate-3',sort_order:3,is_active:true},
  {id:'demo-4',title:'Smart Watch',description:'Heart rate · Fitness tracker',title_es:'Reloj inteligente',description_es:'Ritmo cardíaco · Monitor de ejercicio',category:'fitness',rating:4.6,review_count:'1,102',price:32.99,original_price:39.99,discount:'-18%',image_url:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',affiliate_url:'https://example.com/affiliate-4',sort_order:4,is_active:true}
];

const localRead = () => {
  const saved = localStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : defaults;
};
const localWrite = items => {
  localStorage.setItem(storageKey, JSON.stringify(items));
  return items;
};

export async function getProducts() {
  if (!client) return localRead().filter(item => item.is_active !== false);
  const { data, error } = await client.from('products').select('*').eq('is_active', true).order('sort_order').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAllProducts() {
  if (!client) return localRead();
  const { data, error } = await client.from('products').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveProduct(product, file) {
  let imageUrl = product.image_url;
  if (client && file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const upload = await client.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
    if (upload.error) throw upload.error;
    imageUrl = client.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  } else if (!client && file) {
    imageUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const payload = { ...product, image_url: imageUrl, updated_at: new Date().toISOString() };
  if (client) {
    if (payload.id) {
      const { data, error } = await client.from('products').update(payload).eq('id', payload.id).select().single();
      if (error) throw error;
      return data;
    }
    const { id, ...insertPayload } = payload;
    const { data, error } = await client.from('products').insert(insertPayload).select().single();
    if (error) throw error;
    return data;
  }

  const items = localRead();
  if (payload.id) localWrite(items.map(item => item.id === payload.id ? payload : item));
  else {
    payload.id = crypto.randomUUID();
    localWrite([payload, ...items]);
  }
  return payload;
}

export async function deleteProduct(id) {
  if (client) {
    const { error } = await client.from('products').delete().eq('id', id);
    if (error) throw error;
  } else localWrite(localRead().filter(item => item.id !== id));
}

export async function signIn(email, password) {
  if (!client) return { user: { email: 'Local demo' } };
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (client) await client.auth.signOut();
}

export async function session() {
  if (!client) return { user: { email: 'Local demo' } };
  return (await client.auth.getSession()).data.session;
}

export async function getProductById(id) {
  if (!id) return null;
  if (!client) return localRead().find(item => item.id === id && item.is_active !== false) || null;
  const { data, error } = await client.from('products').select('*').eq('id', id).eq('is_active', true).maybeSingle();
  if (error) throw error;
  return data;
}
