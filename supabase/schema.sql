-- Executar este SQL no SQL Editor do seu projeto Supabase

CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  type TEXT NOT NULL, -- promessa, devocional, data, motivacional, pregacao
  text TEXT NOT NULL,
  reference TEXT,
  author TEXT,
  image_url TEXT, -- URL da imagem gerada pelo @vercel/og que enviaremos para o n8n
  status TEXT DEFAULT 'pending', -- pending, scheduled, posted
  scheduled_for TIMESTAMP WITH TIME ZONE
);

-- Configuração de segurança RLS (opcional, já que usaremos via servidor)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Permitir leitura e escrita anônima para testes (Não recomendado para produção pública, mas OK se o app for só de admin por enquanto)
CREATE POLICY "Enable all for anon" ON posts FOR ALL USING (true);
