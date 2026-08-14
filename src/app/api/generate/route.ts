import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

// Helper for generating formatted date string like "TERÇA-FEIRA, 5 DE AGOSTO"
function getFormattedDateTitle(date: Date) {
  const optionsWeekday: Intl.DateTimeFormatOptions = { weekday: 'long' };
  const optionsDayMonth: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  
  const weekday = date.toLocaleDateString('pt-BR', optionsWeekday).toUpperCase();
  const dayMonth = date.toLocaleDateString('pt-BR', optionsDayMonth).toUpperCase();
  
  return `${weekday}, ${dayMonth}`;
}

// Funcao magica para postar nativamente no Facebook e Instagram
async function postToMeta(imageUrl: string, text: string) {
  const token = process.env.META_PAGE_TOKEN;
  if (!token) {
    console.log("Nenhum META_PAGE_TOKEN encontrado. Pulando envio pras redes.");
    return false;
  }

  try {
    console.log("Enviando para a pagina do Facebook...");
    const fbRes = await fetch(`https://graph.facebook.com/v20.0/me/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrl, message: text, access_token: token })
    });
    const fbData = await fbRes.json();
    if (fbData.error) console.error("Erro Facebook:", fbData.error);
    
    console.log("Procurando a conta do Instagram...");
    const igReq = await fetch(`https://graph.facebook.com/v20.0/me?fields=instagram_business_account&access_token=${token}`);
    const igRes = await igReq.json();
    const igId = igRes?.instagram_business_account?.id;

    if (igId) {
      console.log("Subindo imagem pro Instagram...");
      const containerReq = await fetch(`https://graph.facebook.com/v20.0/${igId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, caption: text, access_token: token })
      });
      const containerRes = await containerReq.json();
      const creationId = containerRes?.id;

      if (creationId) {
        console.log("Publicando no Instagram...");
        const pubReq = await fetch(`https://graph.facebook.com/v20.0/${igId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: creationId, access_token: token })
        });
        const pubData = await pubReq.json();
        if (pubData.error) console.error("Erro Instagram:", pubData.error);
      }
    }
    return true;
  } catch (error) {
    console.error("Erro geral Meta API:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type } = body; // Can be a specific type or 'all'

    const typesToGenerate = type === 'all' 
      ? ['promessa', 'devocional', 'data', 'motivacional', 'pregacao'] as const
      : [type as 'promessa' | 'devocional' | 'data' | 'motivacional' | 'pregacao'];

    const generatedPosts = [];

    for (const t of typesToGenerate) {
      // 1. Generate text with Gemini
      const content = await generateContent(t);
      
      // 2. Prepare OG Image URL params
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const searchParams = new URLSearchParams({
        type: t,
        text: content.text,
        avatarUrl: process.env.NEXT_PUBLIC_AVATAR_URL || 'https://github.com/shadcn.png',
        name: process.env.NEXT_PUBLIC_NAME || 'DIARIODOCEU',
        username: process.env.NEXT_PUBLIC_USERNAME || '@MEUDIARIODOCEU',
      });

      if (t === 'promessa' && content.reference) {
        searchParams.set('reference', content.reference);
      }
      if (t === 'pregacao' && content.author) {
        searchParams.set('author', content.author);
      }
      if (t === 'data') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1); // generate for tomorrow usually
        searchParams.set('dateTitle', getFormattedDateTitle(tomorrow));
      }

      const imageUrl = `${baseUrl}/api/og?${searchParams.toString()}`;

      // 3. Postar nas Redes Sociais! (O Meta exige URL publica)
      const finalImageUrl = imageUrl.replace('localhost', '209.50.229.10');
      const isPosted = await postToMeta(finalImageUrl, content.text);

      // 4. Save to Supabase (marca como 'published' se deu certo)
      const { data, error } = await supabase
        .from('posts')
        .insert({
          type: t,
          text: content.text,
          reference: content.reference || null,
          author: content.author || null,
          image_url: imageUrl,
          status: isPosted ? 'published' : 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase Insert Error:', error);
        throw new Error('Database insertion failed');
      }

      generatedPosts.push(data);
    }

    return NextResponse.json({ success: true, posts: generatedPosts });

  } catch (error: any) {
    console.error('Generation Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
