create table if not exists public.wallet_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  wallet_address text not null unique,
  network text not null default 'eip155:1',
  wallet_provider text not null check (wallet_provider in ('trust', 'walletconnect', 'metamask', 'coinbase', 'phantom', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_connections enable row level security;

create policy "wallet_connections_select_own" on public.wallet_connections
for select using (auth.uid() = user_id);

create policy "wallet_connections_insert_own" on public.wallet_connections
for insert with check (auth.uid() = user_id);

create policy "wallet_connections_update_own" on public.wallet_connections
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "wallet_connections_delete_own" on public.wallet_connections
for delete using (auth.uid() = user_id);

create or replace function public.touch_wallet_connection_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wallet_connections_updated_at on public.wallet_connections;
create trigger wallet_connections_updated_at
before update on public.wallet_connections
for each row execute procedure public.touch_wallet_connection_updated_at();
