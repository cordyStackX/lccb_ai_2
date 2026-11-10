create table public.auth (
  id bigint generated always as identity primary key,
  email text not null unique,
  password text not null,
  f_name text,
  status text,
  role text,
  assign_by text,
  created_at timestamptz not null default now()
);

create table public.auth_student (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  email text unique references public.auth(email),
  year text,
  department text,
  school_id text
);

create table public.auth_business (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  current_plan text,
  current_limit integer,
  current_page_limit integer,
  email text references public.auth(email),
  plan_started_at timestamptz,
  plan_expires_at timestamptz,
  business_name text,
  institutions text
);

create table public.chat_history (
  id bigint generated always as identity primary key,
  email text references public.auth(email),
  history jsonb,
  created_at timestamptz not null default now()
);

create table public.chatbot_pdf_file (
  id bigint generated always as identity primary key,
  suggest text,
  cache jsonb,
  file_name text,
  file text,
  summary text,
  email text references public.auth(email),
  created_at timestamptz not null default now(),
  page_count integer,
  processing_progress jsonb
);

create table public.chatbot_pdf_file_private (
  id bigint generated always as identity primary key,
  processing_progress jsonb,
  cache jsonb,
  file_name text,
  file text,
  summary text,
  email text references public.auth(email),
  created_at timestamptz not null default now()
);

create table public.chatbot_public (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text,
  instruction text,
  body text,
  email text unique references public.auth(email)
);

create table public.image_url (
  id bigint generated always as identity primary key,
  email text references public.auth(email),
  image_link text,
  image_name text,
  created_at timestamptz not null default now()
);

create table public.pdf_file (
  id bigint generated always as identity primary key,
  file text,
  email text references public.auth(email),
  file_name text,
  created_at timestamptz not null default now()
);

create table public.profile_pic (
  id bigint generated always as identity primary key,
  email text unique references public.auth(email),
  file_link text,
  file_name text,
  created_at timestamptz not null default now()
);

create table public.setting (
  id bigint generated always as identity primary key,
  email text references public.auth(email),
  state text,
  target text,
  created_at timestamptz not null default now()
);

create table public.system_logs (
  id bigint generated always as identity primary key,
  request text references public.auth(email),
  api_request integer,
  uploaded_pdf integer,
  created_at timestamptz not null default now()
);

create table public.payments (
  id bigint generated always as identity primary key,
  account_number text,
  reason text,
  plan_type text,
  email text references public.auth(email),
  created_at timestamptz not null default now(),
  amount double precision,
  method text,
  vat double precision,
  status text
);

create table public.chatbot_student_records (
  id bigint generated always as identity primary key,
  student_email text not null references public.auth_student(email),
  source_pdf_id bigint not null references public.chatbot_pdf_file_private(id),
  source_file_name text not null,
  records_ciphertext text not null,
  created_at timestamptz not null default now(),
  page_numbers integer[] not null default '{}',
  record_count integer not null default 0 check (record_count >= 0)
);
