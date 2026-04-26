-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- App users table (extends Supabase auth)
create table if not exists public.app_users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text not null default '',
  role text not null default 'recruiter' check (role in ('admin','sr_recruiter','recruiter')),
  title text default 'Recruiter',
  reports_to uuid references public.app_users(id),
  points integer default 0,
  google_sheet_url text default '',
  created_at timestamptz default now()
);

-- Profiles table
create table if not exists public.profiles (
  id uuid default uuid_generate_v4() primary key,
  type text not null default 'Candidate' check (type in ('Candidate','Recruiter')),
  name text not null,
  mobile text default '',
  email text default '',
  experience text default '',
  role text default '',
  qualification text default '',
  skills text default '',
  city text default '',
  industry text default '',
  gender text default '',
  linkedin text default '',
  status text default 'New',
  channels text[] default '{}',
  assigned_to uuid references public.app_users(id),
  resume_name text default '',
  resume_url text default '',
  ai_summary text default '',
  feedback_count integer default 0,
  created_by uuid references public.app_users(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Feedbacks table
create table if not exists public.feedbacks (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  status text default '',
  created_by uuid references public.app_users(id) not null,
  tagged_user uuid references public.app_users(id),
  created_at timestamptz default now()
);

-- Dropdown options (admin managed)
create table if not exists public.dropdown_options (
  id uuid default uuid_generate_v4() primary key,
  category text not null,
  value text not null,
  sort_order integer default 0,
  created_by uuid references public.app_users(id),
  created_at timestamptz default now(),
  unique(category, value)
);

-- Notifications
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  to_user uuid references public.app_users(id) on delete cascade not null,
  from_user uuid references public.app_users(id),
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Points log
create table if not exists public.points_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.app_users(id) on delete cascade not null,
  points integer not null,
  reason text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.app_users enable row level security;
alter table public.profiles enable row level security;
alter table public.feedbacks enable row level security;
alter table public.notifications enable row level security;
alter table public.points_log enable row level security;
alter table public.dropdown_options enable row level security;

-- RLS Policies

-- app_users: users can see all (for assignments), edit only their own
create policy "Users can view all app_users" on public.app_users for select using (true);
create policy "Users can insert their own record" on public.app_users for insert with check (auth.uid() = id);
create policy "Users can update their own record" on public.app_users for update using (auth.uid() = id);

-- profiles: users see only their own, admin sees all
create policy "Users see own profiles" on public.profiles for select
  using (created_by = auth.uid() or
    exists (select 1 from public.app_users where id = auth.uid() and role = 'admin') or
    exists (select 1 from public.app_users u where u.id = auth.uid() and u.role = 'sr_recruiter'
      and exists (select 1 from public.app_users sub where sub.id = profiles.created_by and sub.reports_to = auth.uid()))
  );
create policy "Users can insert profiles" on public.profiles for insert with check (auth.uid() = created_by);
create policy "Users can update own profiles" on public.profiles for update using (
  created_by = auth.uid() or
  exists (select 1 from public.app_users where id = auth.uid() and role in ('admin','sr_recruiter'))
);
create policy "Admin can delete profiles" on public.profiles for delete using (
  exists (select 1 from public.app_users where id = auth.uid() and role = 'admin')
);

-- feedbacks: same visibility as profiles
create policy "Users see feedbacks for their profiles" on public.feedbacks for select
  using (exists (select 1 from public.profiles p where p.id = profile_id and (
    p.created_by = auth.uid() or
    exists (select 1 from public.app_users where id = auth.uid() and role = 'admin')
  )));
create policy "Users can insert feedbacks" on public.feedbacks for insert with check (auth.uid() = created_by);

-- notifications: users see their own
create policy "Users see own notifications" on public.notifications for select using (to_user = auth.uid());
create policy "Anyone can send notifications" on public.notifications for insert with check (true);
create policy "Users can mark read" on public.notifications for update using (to_user = auth.uid());

-- dropdown options: everyone reads, admin writes
create policy "Everyone reads dropdowns" on public.dropdown_options for select using (true);
create policy "Admin manages dropdowns" on public.dropdown_options for all
  using (exists (select 1 from public.app_users where id = auth.uid() and role = 'admin'));

-- points log
create policy "Users see own points" on public.points_log for select using (user_id = auth.uid() or
  exists (select 1 from public.app_users where id = auth.uid() and role = 'admin'));
create policy "System inserts points" on public.points_log for insert with check (true);

-- Auto update feedback_count on profiles
create or replace function update_feedback_count()
returns trigger as $$
begin
  update public.profiles set feedback_count = (
    select count(*) from public.feedbacks where profile_id = coalesce(NEW.profile_id, OLD.profile_id)
  ), updated_at = now()
  where id = coalesce(NEW.profile_id, OLD.profile_id);
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

drop trigger if exists on_feedback_change on public.feedbacks;
create trigger on_feedback_change after insert or delete on public.feedbacks
  for each row execute function update_feedback_count();

-- Insert default admin (replace with your actual user ID after first login)
-- UPDATE public.app_users SET role = 'admin' WHERE email = 'smilingdbms@gmail.com';
