
-- FASE 1: Estrutura de Banco + Storage + RLS

-- 1) Tabelas
create table if not exists public.planos_contratos (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references public.dados_planos(id) on delete cascade,
  file_name text not null,
  -- Armazena o mesmo "name" usado em storage.objects (sem o nome do bucket)
  storage_object_path text not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references public.profiles(id) on delete set null,
  -- 1 contrato por plano
  unique (plano_id),
  -- Não permitir duplicar caminho de arquivo
  unique (storage_object_path)
);

create index if not exists idx_planos_contratos_plano_id on public.planos_contratos(plano_id);

create table if not exists public.planos_demonstrativos (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references public.dados_planos(id) on delete cascade,
  mes int not null check (mes between 1 and 12),
  ano int not null,
  -- Armazenam o mesmo "name" usado em storage.objects (sem o nome do bucket)
  path_demonstrativo text,
  path_boleto text,
  uploaded_at timestamptz not null default now(),
  -- Apenas um registro por plano por mês/ano
  unique (plano_id, mes, ano)
);

create index if not exists idx_planos_demonstrativos_plano_id on public.planos_demonstrativos(plano_id);

-- 2) Habilitar RLS
alter table public.planos_contratos enable row level security;
alter table public.planos_demonstrativos enable row level security;

-- 3) Políticas RLS para planos_contratos
-- SELECT: Corretora dona do plano ou Admin
drop policy if exists "planos_contratos_select_corretora_admin" on public.planos_contratos;
create policy "planos_contratos_select_corretora_admin"
on public.planos_contratos
for select
using (
  exists (
    select 1
    from public.dados_planos dp
    join public.cnpjs c on c.id = dp.cnpj_id
    join public.empresas e on e.id = c.empresa_id
    where dp.id = planos_contratos.plano_id
      and (
        e.corretora_id = auth.uid()
        or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
      )
  )
);

-- SELECT: Empresa dona do plano
drop policy if exists "planos_contratos_select_empresa" on public.planos_contratos;
create policy "planos_contratos_select_empresa"
on public.planos_contratos
for select
using (
  exists (
    select 1
    from public.dados_planos dp
    join public.cnpjs c on c.id = dp.cnpj_id
    join public.empresas e on e.id = c.empresa_id
    join public.profiles p on p.empresa_id = e.id
    where dp.id = planos_contratos.plano_id
      and p.id = auth.uid()
      and p.role = 'empresa'
  )
);

-- INSERT/UPDATE/DELETE: Corretora dona do plano ou Admin
drop policy if exists "planos_contratos_iud_corretora_admin" on public.planos_contratos;
create policy "planos_contratos_iud_corretora_admin"
on public.planos_contratos
for all
using (
  exists (
    select 1
    from public.dados_planos dp
    join public.cnpjs c on c.id = dp.cnpj_id
    join public.empresas e on e.id = c.empresa_id
    where dp.id = planos_contratos.plano_id
      and (
        e.corretora_id = auth.uid()
        or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
      )
  )
)
with check (
  exists (
    select 1
    from public.dados_planos dp
    join public.cnpjs c on c.id = dp.cnpj_id
    join public.empresas e on e.id = c.empresa_id
    where dp.id = planos_contratos.plano_id
      and (
        e.corretora_id = auth.uid()
        or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
      )
  )
);

-- 4) Políticas RLS para planos_demonstrativos
-- SELECT: Corretora dona do plano ou Admin
drop policy if exists "planos_demonstrativos_select_corretora_admin" on public.planos_demonstrativos;
create policy "planos_demonstrativos_select_corretora_admin"
on public.planos_demonstrativos
for select
using (
  exists (
    select 1
    from public.dados_planos dp
    join public.cnpjs c on c.id = dp.cnpj_id
    join public.empresas e on e.id = c.empresa_id
    where dp.id = planos_demonstrativos.plano_id
      and (
        e.corretora_id = auth.uid()
        or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
      )
  )
);

-- SELECT: Empresa dona do plano
drop policy if exists "planos_demonstrativos_select_empresa" on public.planos_demonstrativos;
create policy "planos_demonstrativos_select_empresa"
on public.planos_demonstrativos
for select
using (
  exists (
    select 1
    from public.dados_planos dp
    join public.cnpjs c on c.id = dp.cnpj_id
    join public.empresas e on e.id = c.empresa_id
    join public.profiles p on p.empresa_id = e.id
    where dp.id = planos_demonstrativos.plano_id
      and p.id = auth.uid()
      and p.role = 'empresa'
  )
);

-- INSERT/UPDATE/DELETE: Corretora dona do plano ou Admin
drop policy if exists "planos_demonstrativos_iud_corretora_admin" on public.planos_demonstrativos;
create policy "planos_demonstrativos_iud_corretora_admin"
on public.planos_demonstrativos
for all
using (
  exists (
    select 1
    from public.dados_planos dp
    join public.cnpjs c on c.id = dp.cnpj_id
    join public.empresas e on e.id = c.empresa_id
    where dp.id = planos_demonstrativos.plano_id
      and (
        e.corretora_id = auth.uid()
        or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
      )
  )
)
with check (
  exists (
    select 1
    from public.dados_planos dp
    join public.cnpjs c on c.id = dp.cnpj_id
    join public.empresas e on e.id = c.empresa_id
    where dp.id = planos_demonstrativos.plano_id
      and (
        e.corretora_id = auth.uid()
        or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
      )
  )
);

-- 5) Bucket de Storage
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'documentos_planos') then
    insert into storage.buckets (id, name, public) values ('documentos_planos', 'documentos_planos', false);
  end if;
end$$;

-- 6) Função auxiliar para extrair o plano_id do path do Storage
create or replace function public.path_plano_id(_name text)
returns uuid
language sql
immutable
as $$
  select substring(_name from 'planos/([0-9a-f-]{36})/')::uuid
$$;

-- 7) Políticas de RLS no storage.objects (somente para o bucket documentos_planos)

-- SELECT para Empresa: pode baixar se o arquivo estiver mapeado a um plano da sua empresa
drop policy if exists "doc_planos_select_empresa" on storage.objects;
create policy "doc_planos_select_empresa"
on storage.objects
for select
using (
  bucket_id = 'documentos_planos'
  and (
    exists (
      select 1
      from public.planos_contratos pc
      join public.dados_planos dp on dp.id = pc.plano_id
      join public.cnpjs c on c.id = dp.cnpj_id
      join public.empresas e on e.id = c.empresa_id
      join public.profiles p on p.empresa_id = e.id
      where pc.storage_object_path = storage.objects.name
        and p.id = auth.uid()
        and p.role = 'empresa'
    )
    or exists (
      select 1
      from public.planos_demonstrativos pd
      join public.dados_planos dp on dp.id = pd.plano_id
      join public.cnpjs c on c.id = dp.cnpj_id
      join public.empresas e on e.id = c.empresa_id
      join public.profiles p on p.empresa_id = e.id
      where (pd.path_demonstrativo = storage.objects.name or pd.path_boleto = storage.objects.name)
        and p.id = auth.uid()
        and p.role = 'empresa'
    )
  )
);

-- SELECT para Corretora/Admin: pode baixar se o arquivo pertencer a um plano da sua carteira
drop policy if exists "doc_planos_select_corretora_admin" on storage.objects;
create policy "doc_planos_select_corretora_admin"
on storage.objects
for select
using (
  bucket_id = 'documentos_planos'
  and (
    exists (
      select 1
      from public.planos_contratos pc
      join public.dados_planos dp on dp.id = pc.plano_id
      join public.cnpjs c on c.id = dp.cnpj_id
      join public.empresas e on e.id = c.empresa_id
      where pc.storage_object_path = storage.objects.name
        and e.corretora_id = auth.uid()
    )
    or exists (
      select 1
      from public.planos_demonstrativos pd
      join public.dados_planos dp on dp.id = pd.plano_id
      join public.cnpjs c on c.id = dp.cnpj_id
      join public.empresas e on e.id = c.empresa_id
      where (pd.path_demonstrativo = storage.objects.name or pd.path_boleto = storage.objects.name)
        and e.corretora_id = auth.uid()
    )
    or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
  )
);

-- INSERT (upload) para Corretora/Admin: permitido se o path contiver um plano_id da sua carteira
drop policy if exists "doc_planos_insert_corretora_admin" on storage.objects;
create policy "doc_planos_insert_corretora_admin"
on storage.objects
for insert
with check (
  bucket_id = 'documentos_planos'
  and (
    exists (
      select 1
      from public.dados_planos dp
      join public.cnpjs c on c.id = dp.cnpj_id
      join public.empresas e on e.id = c.empresa_id
      where dp.id = public.path_plano_id(storage.objects.name)
        and e.corretora_id = auth.uid()
    )
    or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
  )
);

-- UPDATE (mover/renomear) para Corretora/Admin sob as mesmas condições
drop policy if exists "doc_planos_update_corretora_admin" on storage.objects;
create policy "doc_planos_update_corretora_admin"
on storage.objects
for update
using (
  bucket_id = 'documentos_planos'
  and (
    exists (
      select 1
      from public.dados_planos dp
      join public.cnpjs c on c.id = dp.cnpj_id
      join public.empresas e on e.id = c.empresa_id
      where dp.id = public.path_plano_id(storage.objects.name)
        and e.corretora_id = auth.uid()
    )
    or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
  )
)
with check (
  bucket_id = 'documentos_planos'
  and (
    exists (
      select 1
      from public.dados_planos dp
      join public.cnpjs c on c.id = dp.cnpj_id
      join public.empresas e on e.id = c.empresa_id
      where dp.id = public.path_plano_id(storage.objects.name)
        and e.corretora_id = auth.uid()
    )
    or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
  )
);

-- DELETE para Corretora/Admin
drop policy if exists "doc_planos_delete_corretora_admin" on storage.objects;
create policy "doc_planos_delete_corretora_admin"
on storage.objects
for delete
using (
  bucket_id = 'documentos_planos'
  and (
    exists (
      select 1
      from public.dados_planos dp
      join public.cnpjs c on c.id = dp.cnpj_id
      join public.empresas e on e.id = c.empresa_id
      where dp.id = public.path_plano_id(storage.objects.name)
        and e.corretora_id = auth.uid()
    )
    or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
  )
);
