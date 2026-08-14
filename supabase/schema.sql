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

-- Tabela para o Inbox (CRM) - Armazenar Comentários e Directs
CREATE TABLE inbox_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  platform TEXT NOT NULL, -- 'instagram' ou 'facebook'
  type TEXT NOT NULL, -- 'comment' ou 'direct'
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  post_id TEXT, -- Se for comentário, em qual post foi
  is_read BOOLEAN DEFAULT false,
  is_replied BOOLEAN DEFAULT false
);

ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon inbox" ON inbox_messages FOR ALL USING (true);
