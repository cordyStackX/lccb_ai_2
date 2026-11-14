begin;

alter table public.chatbot_pdf_file
    add column if not exists page_content jsonb;

commit;
