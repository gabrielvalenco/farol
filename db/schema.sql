-- Farol: tabela de relatorios.
-- O servidor cria sozinho na primeira analise. Rode manualmente so se o
-- usuario do banco nao tiver permissao de CREATE.

create table if not exists farol_reports (
  slug text primary key,
  url text not null,
  host text not null,
  score smallint not null,
  created_at timestamptz not null default now(),
  data jsonb not null
);

create index if not exists farol_reports_host_created on farol_reports (host, created_at desc);
