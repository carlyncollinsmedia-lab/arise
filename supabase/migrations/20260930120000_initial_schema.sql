-- Arise initial schema (build step 1 backend). Source: HANDOFF.md section 6.4 and
-- TECHNICAL-NOTES.md "Data". Every user table has Row Level Security so each person
-- can only ever read or change their own rows.

-- One row per account: setup choices and settings.
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 40),
  companion text not null default 'woman' check (companion in ('woman', 'man', 'none')),
  avatar_preset text,
  weather_city text,
  weather_lat double precision,
  weather_lon double precision,
  support_country text,                       -- ISO country code, confirmed by the user
  notice_accepted_at timestamptz,             -- the sign-up notice (PRD F02)
  read_aloud boolean not null default false,  -- read the pep talk out loud (F07)
  nudge_enabled boolean not null default true,
  lock_screen_full_text boolean not null default false,
  evening_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The alarm itself lives on the phone (AlarmKit). This copy is informational,
-- so a new phone can offer to restore it. The phone is always the truth.
create table public.alarm_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  alarm_time time not null,
  weekdays smallint[] not null default '{1,2,3,4,5}', -- 0 = Sunday ... 6 = Saturday
  snooze_minutes smallint not null default 5 check (snooze_minutes between 1 and 30),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id, device_id)
);

-- One entry per person per morning. The id is made on the phone so a mood saved
-- offline keeps the same id when it syncs.
create table public.entries (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_date date not null,                 -- the phone's local date; never changes
  morning_mood text check (morning_mood in ('rough', 'low', 'okay', 'good', 'great')),
  morning_note text check (char_length(morning_note) <= 280),
  mood_changes smallint not null default 0,
  affirmation_text text,
  affirmation_status text check (affirmation_status in ('generated', 'fallback', 'crisis')),
  intention text check (char_length(intention) <= 120),
  intention_outcome text check (intention_outcome in ('done', 'partly', 'not_done')),
  evening_mood text check (evening_mood in ('rough', 'low', 'okay', 'good', 'great')),
  weather_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, routine_date)
);

create table public.reminders (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 80),
  fire_at timestamptz not null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

-- Reviewed by a person. The AI never writes phone numbers. Readable by everyone,
-- changeable only from the dashboard.
create table public.support_lines (
  country_code text primary key,
  line_text text not null,
  source_url text not null,
  last_verified date not null
);

-- Reviewed pep talks used when the AI is unavailable. Read-only for the app.
create table public.fallback_affirmations (
  id bigint generated always as identity primary key,
  mood text not null check (mood in ('rough', 'low', 'okay', 'good', 'great')),
  text text not null
);

create index entries_user_date_idx on public.entries (user_id, routine_date desc);
create index reminders_user_fire_idx on public.reminders (user_id, fire_at);

-- Keep updated_at honest.
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger alarm_schedules_touch before update on public.alarm_schedules for each row execute function public.touch_updated_at();
create trigger entries_touch before update on public.entries for each row execute function public.touch_updated_at();

-- Make a profile row as soon as someone signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Row Level Security: each person sees and changes only their own rows.
alter table public.profiles enable row level security;
alter table public.alarm_schedules enable row level security;
alter table public.entries enable row level security;
alter table public.reminders enable row level security;
alter table public.support_lines enable row level security;
alter table public.fallback_affirmations enable row level security;

create policy "own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own alarms" on public.alarm_schedules for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own entries" on public.entries for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own reminders" on public.reminders for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "read support lines" on public.support_lines for select to anon, authenticated using (true);
create policy "read fallbacks" on public.fallback_affirmations for select to anon, authenticated using (true);
