-- ==========================================================================
-- SUPABASE DATABASE SCHEMA FOR KHAAVIYA'S BIRTHDAY SURPRISE APP
-- Run this script in the Supabase SQL Editor to set up the tables, 
-- storage buckets, and RLS (Row Level Security) policies.
-- ==========================================================================

-- Enable extensions
create extension if not exists "uuid-ossp";

-- 1. FOLDERS TABLE (Dropbox-style hierarchical directories)
create table if not exists public.folders (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  parent_id uuid references public.folders(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. FILES TABLE (Dropbox-style files metadata linked to Supabase Storage)
create table if not exists public.files (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  storage_path text not null,
  public_url text not null,
  file_type text not null, -- 'image', 'video', 'pdf'
  mime_type text not null,
  file_size integer not null,
  folder_id uuid references public.folders(id) on delete cascade,
  caption text default '',
  sort_order integer default 0,
  is_gallery_photo boolean default false,
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. BIRTHDAY SURPRISE SETTINGS TABLE
create table if not exists public.birthday_settings (
  id uuid default gen_random_uuid() primary key,
  name text default 'Khaaviya' not null,
  birthday_date timestamp with time zone default '2026-12-26 00:00:00+00'::timestamp with time zone not null,
  intro_title text default 'For someone very special...' not null,
  intro_message text default 'Every second brings a new reason to smile, and a special moment is quietly making its way to you.' not null,
  birthday_message text default 'Happy Birthday, Khaaviya! 🎂❤️' not null,
  final_message text default 'Every picture has a story. Every memory has a feeling. And today is all about you, Khaaviya. ❤️' not null,
  theme text default 'velvet' not null,
  music_url text default '' not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Populate default birthday settings row
insert into public.birthday_settings (id, name, birthday_date, theme)
values (
  'd69482b4-5f56-4279-b1d5-bc44d71597d3', 
  'Khaaviya', 
  '2026-12-26 00:00:00+00'::timestamp with time zone, 
  'velvet'
)
on conflict (id) do nothing;

-- ==========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================================

-- Enable RLS on all tables
alter table public.folders enable row level security;
alter table public.files enable row level security;
alter table public.birthday_settings enable row level security;

-- --- Folders Policies ---
create policy "Allow public read access to folders"
  on public.folders for select
  using (true);

create policy "Allow authenticated admins to write folders"
  on public.folders for all
  to authenticated
  using (true)
  with check (true);

-- --- Files Policies ---
create policy "Allow public read access to files"
  on public.files for select
  using (true);

create policy "Allow authenticated admins to write files"
  on public.files for all
  to authenticated
  using (true)
  with check (true);

-- --- Birthday Settings Policies ---
create policy "Allow public read access to settings"
  on public.birthday_settings for select
  using (true);

create policy "Allow authenticated admins to write settings"
  on public.birthday_settings for all
  to authenticated
  using (true)
  with check (true);

-- ==========================================================================
-- SUPABASE STORAGE BUCKET DEFINITION & POLICIES
-- ==========================================================================

-- Create the memories bucket (public read access)
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

-- Storage select policy (Public visitors can read memories)
create policy "Memories public read access"
  on storage.objects for select
  using (bucket_id = 'memories');

-- Storage upload policy (Only logged in admin users can upload files)
create policy "Memories admin upload access"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'memories');

-- Storage update policy (Only logged in admin users can update files)
create policy "Memories admin update access"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'memories')
  with check (bucket_id = 'memories');

-- Storage delete policy (Only logged in admin users can delete files)
create policy "Memories admin delete access"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'memories');
