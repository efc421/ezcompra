create table if not exists public.products (
  id uuid primary key default gen_random_uuid(), title text not null, description text not null,
  title_es text, description_es text,
  category text not null default 'lifestyle', rating numeric(2,1) default 5.0,
  review_count text default '', price numeric(10,2) not null, original_price numeric(10,2),
  discount text default '', discount_ends_at timestamptz, image_url text not null, affiliate_url text not null,
  is_active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.products add column if not exists discount_ends_at timestamptz;
alter table public.products add column if not exists title_es text;
alter table public.products add column if not exists description_es text;
alter table public.products enable row level security;
create policy "Public can view active products" on public.products for select using (is_active = true or auth.role() = 'authenticated');
create policy "Admin can add products" on public.products for insert to authenticated with check (true);
create policy "Admin can update products" on public.products for update to authenticated using (true) with check (true);
create policy "Admin can delete products" on public.products for delete to authenticated using (true);
insert into storage.buckets (id,name,public) values ('product-images','product-images',true) on conflict (id) do update set public=true;
create policy "Public can view product images" on storage.objects for select using (bucket_id='product-images');
create policy "Admin can upload product images" on storage.objects for insert to authenticated with check (bucket_id='product-images');
create policy "Admin can update product images" on storage.objects for update to authenticated using (bucket_id='product-images');
create policy "Admin can delete product images" on storage.objects for delete to authenticated using (bucket_id='product-images');

-- Phase 2: AI-generated product content
alter table public.products add column if not exists asin text;
alter table public.products add column if not exists source_url text;
alter table public.products add column if not exists long_description text;
alter table public.products add column if not exists long_description_es text;
alter table public.products add column if not exists seo_title text;
alter table public.products add column if not exists seo_title_es text;
alter table public.products add column if not exists meta_description text;
alter table public.products add column if not exists meta_description_es text;
alter table public.products add column if not exists keywords text[] default '{}';
alter table public.products add column if not exists pros text[] default '{}';
alter table public.products add column if not exists cons text[] default '{}';
alter table public.products add column if not exists tags text[] default '{}';
alter table public.products add column if not exists specifications jsonb default '{}'::jsonb;
create index if not exists products_asin_idx on public.products (asin);
