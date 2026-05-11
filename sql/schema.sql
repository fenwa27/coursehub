-- ============================================================
-- CourseHub - Complete Supabase Schema
-- Paste this entire file into Supabase SQL Editor and click Run
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- TABLES
-- ============================================================

-- Schools
create table if not exists schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  short_name text not null,
  email_domain text not null unique,
  state text,
  created_at timestamptz default now()
);

-- Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  school_id uuid references schools(id),
  level text check (level in ('100L','200L','300L','400L','500L','Postgrad')),
  role text default 'student' check (role in ('student','admin')),
  is_verified_seller boolean default false,
  total_earnings numeric(12,2) default 0,
  total_downloads integer default 0,
  avg_rating numeric(3,2) default 0,
  stripe_account_id text,
  bank_code text,
  bank_account_number text,
  bank_account_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Materials
create table if not exists materials (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid references profiles(id) on delete cascade,
  school_id uuid references schools(id),
  title text not null,
  description text,
  course_code text,
  level text check (level in ('100L','200L','300L','400L','500L','Postgrad')),
  type text check (type in ('Past Questions','Lecture Notes','Assignments','Textbooks','Study Guides','Lab Reports')),
  price numeric(10,2) default 0,
  is_free boolean generated always as (price = 0) stored,
  file_path text,
  preview_path text,
  file_size_kb integer,
  page_count integer,
  download_count integer default 0,
  view_count integer default 0,
  purchase_count integer default 0,
  avg_rating numeric(3,2) default 0,
  review_count integer default 0,
  status text default 'pending' check (status in ('pending','approved','rejected','flagged')),
  ai_risk_score text default 'LOW' check (ai_risk_score in ('LOW','MEDIUM','HIGH')),
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Full-text search index
create index if not exists materials_search_idx on materials
  using gin(to_tsvector('english', title || ' ' || coalesce(description,'') || ' ' || coalesce(course_code,'')));

-- Purchases
create table if not exists purchases (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid references profiles(id) on delete cascade,
  material_id uuid references materials(id) on delete cascade,
  amount_paid numeric(10,2) not null,
  platform_fee numeric(10,2) not null,
  seller_earnings numeric(10,2) not null,
  paystack_reference text unique,
  paystack_transaction_id text,
  status text default 'pending' check (status in ('pending','success','failed','refunded')),
  created_at timestamptz default now(),
  unique(buyer_id, material_id)
);

-- Downloads (tracks each download event)
create table if not exists downloads (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid references profiles(id) on delete cascade,
  material_id uuid references materials(id) on delete cascade,
  purchase_id uuid references purchases(id),
  signed_url_used boolean default false,
  created_at timestamptz default now()
);

-- Reviews
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  reviewer_id uuid references profiles(id) on delete cascade,
  material_id uuid references materials(id) on delete cascade,
  purchase_id uuid references purchases(id),
  rating integer check (rating between 1 and 5),
  title text,
  body text,
  tags text[],
  helpful_count integer default 0,
  is_verified_purchase boolean default true,
  status text default 'active' check (status in ('active','removed','flagged')),
  created_at timestamptz default now(),
  unique(reviewer_id, material_id)
);

-- Withdrawals
create table if not exists withdrawals (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid references profiles(id) on delete cascade,
  amount numeric(10,2) not null,
  bank_code text,
  bank_account_number text,
  bank_account_name text,
  paystack_transfer_code text,
  paystack_recipient_code text,
  status text default 'pending' check (status in ('pending','processing','success','failed')),
  failure_reason text,
  created_at timestamptz default now()
);

-- Saved Materials (wishlist)
create table if not exists saved_materials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  material_id uuid references materials(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, material_id)
);

-- School Verifications
create table if not exists school_verifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  school_id uuid references schools(id),
  verification_email text,
  token text unique,
  verified boolean default false,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- SEED DATA - Nigerian Universities
-- ============================================================
insert into schools (name, short_name, email_domain, state) values
  ('University of Lagos', 'UNILAG', 'student.unilag.edu.ng', 'Lagos'),
  ('Obafemi Awolowo University', 'OAU', 'student.oauife.edu.ng', 'Osun'),
  ('Federal University of Technology Akure', 'FUTA', 'student.futa.edu.ng', 'Ondo'),
  ('University of Ibadan', 'UI', 'student.ui.edu.ng', 'Oyo'),
  ('Ahmadu Bello University', 'ABU', 'student.abu.edu.ng', 'Kaduna'),
  ('University of Nigeria Nsukka', 'UNN', 'student.unn.edu.ng', 'Enugu'),
  ('Lagos State University', 'LASU', 'student.lasu.edu.ng', 'Lagos'),
  ('Covenant University', 'CU', 'student.covenantuniversity.edu.ng', 'Ogun'),
  ('University of Benin', 'UNIBEN', 'student.uniben.edu.ng', 'Edo'),
  ('Nnamdi Azikiwe University', 'NAU', 'student.unizik.edu.ng', 'Anambra')
on conflict (email_domain) do nothing;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Credit seller earnings on successful purchase (85/15 split)
create or replace function handle_purchase_success()
returns trigger language plpgsql security definer as $$
declare
  v_seller_id uuid;
begin
  if new.status = 'success' and (old.status is null or old.status != 'success') then
    select seller_id into v_seller_id from materials where id = new.material_id;
    update profiles
      set total_earnings = total_earnings + new.seller_earnings
      where id = v_seller_id;
    update materials
      set purchase_count = purchase_count + 1
      where id = new.material_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_purchase_success on purchases;
create trigger on_purchase_success
  after insert or update on purchases
  for each row execute function handle_purchase_success();

-- Update material rating when review is added
create or replace function update_material_rating()
returns trigger language plpgsql as $$
begin
  update materials
  set
    avg_rating = (select avg(rating) from reviews where material_id = new.material_id and status = 'active'),
    review_count = (select count(*) from reviews where material_id = new.material_id and status = 'active')
  where id = new.material_id;
  update profiles
  set avg_rating = (
    select coalesce(avg(m.avg_rating), 0)
    from materials m where m.seller_id = profiles.id and m.status = 'approved'
  )
  where id = (select seller_id from materials where id = new.material_id);
  return new;
end;
$$;

drop trigger if exists on_review_change on reviews;
create trigger on_review_change
  after insert or update on reviews
  for each row execute function update_material_rating();

-- Increment download counter
create or replace function handle_download()
returns trigger language plpgsql as $$
begin
  update materials set download_count = download_count + 1 where id = new.material_id;
  update profiles set total_downloads = total_downloads + 1
    where id = (select seller_id from materials where id = new.material_id);
  return new;
end;
$$;

drop trigger if exists on_download on downloads;
create trigger on_download
  after insert on downloads
  for each row execute function handle_download();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table materials enable row level security;
alter table purchases enable row level security;
alter table downloads enable row level security;
alter table reviews enable row level security;
alter table withdrawals enable row level security;
alter table saved_materials enable row level security;
alter table school_verifications enable row level security;

-- Profiles
create policy "Users can view any profile" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Materials
create policy "Anyone can view approved materials" on materials for select using (status = 'approved');
create policy "Sellers can view own materials" on materials for select using (auth.uid() = seller_id);
create policy "Authenticated users can insert" on materials for insert with check (auth.uid() = seller_id);
create policy "Sellers can update own materials" on materials for update using (auth.uid() = seller_id);

-- Purchases
create policy "Buyers can view own purchases" on purchases for select using (auth.uid() = buyer_id);
create policy "Sellers can view purchases of their materials" on purchases for select
  using (auth.uid() = (select seller_id from materials where id = material_id));
create policy "Authenticated users can insert purchases" on purchases for insert with check (auth.uid() = buyer_id);

-- Downloads
create policy "Users can view own downloads" on downloads for select using (auth.uid() = buyer_id);
create policy "Authenticated users can log downloads" on downloads for insert with check (auth.uid() = buyer_id);

-- Reviews
create policy "Anyone can view active reviews" on reviews for select using (status = 'active');
create policy "Buyers can insert reviews" on reviews for insert with check (auth.uid() = reviewer_id);
create policy "Reviewers can update own reviews" on reviews for update using (auth.uid() = reviewer_id);

-- Withdrawals
create policy "Sellers can view own withdrawals" on withdrawals for select using (auth.uid() = seller_id);
create policy "Sellers can request withdrawals" on withdrawals for insert with check (auth.uid() = seller_id);

-- Saved materials
create policy "Users can manage own saved materials" on saved_materials
  for all using (auth.uid() = user_id);

-- Schools (public read)
create policy "Anyone can view schools" on schools for select using (true);

-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase dashboard)
-- ============================================================
-- Go to Storage > New bucket > "materials" (private, 50MB limit)
-- Go to Storage > New bucket > "previews" (public, 5MB limit)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('materials', 'materials', false, 52428800, array['application/pdf','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('previews', 'previews', true, 5242880, array['application/pdf','image/png','image/jpeg'])
on conflict (id) do nothing;

create policy "Sellers can upload materials" on storage.objects
  for insert with check (bucket_id = 'materials' and auth.role() = 'authenticated');
create policy "Buyers can read purchased materials" on storage.objects
  for select using (bucket_id = 'materials' and auth.role() = 'authenticated');
create policy "Anyone can read previews" on storage.objects
  for select using (bucket_id = 'previews');
