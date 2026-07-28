CREATE TABLE public.llms_txt (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.llms_txt ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON public.llms_txt FOR SELECT USING (true);
CREATE POLICY "Authenticated Full Access" ON public.llms_txt FOR ALL TO authenticated USING (true) WITH CHECK (true);
