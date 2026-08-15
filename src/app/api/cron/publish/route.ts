import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
        console.log("Aguardando o Instagram processar a imagem...");
        let isReady = false;
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 3000));
          const statusReq = await fetch(`https://graph.facebook.com/v20.0/${creationId}?fields=status_code&access_token=${token}`);
          const statusRes = await statusReq.json();
          console.log(`Status do processamento (${i+1}/10):`, statusRes.status_code);
          if (statusRes.status_code === 'FINISHED') {
            isReady = true;
            break;
          }
        }

        if (isReady) {
          console.log("Publicando no Instagram...");
          const pubReq = await fetch(`https://graph.facebook.com/v20.0/${igId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: creationId, access_token: token })
          });
          const pubData = await pubReq.json();
          if (pubData.error) console.error("Erro Instagram:", pubData.error);
        } else {
          console.error("Erro Instagram: Tempo esgotado aguardando processamento da imagem.");
        }
      }
    }
    return true;
  } catch (error) {
    console.error("Erro geral Meta API:", error);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    // Verificando autenticação do Vercel Cron
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Busca todos os posts pendentes com data de agendamento <= agora
    const { data: postsToPublish, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'pending')
      .not('scheduled_for', 'is', null)
      .lte('scheduled_for', new Date().toISOString());

    if (error) {
      console.error('Erro ao buscar posts agendados:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!postsToPublish || postsToPublish.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhum post agendado para agora.' });
    }

    console.log(`Encontrados ${postsToPublish.length} posts para publicar.`);

    const results = [];

    // 2. Publica um por um
    for (const post of postsToPublish) {
      console.log(`Publicando post ID: ${post.id}`);
      
      const isPosted = await postToMeta(post.image_url, post.text);

      if (isPosted) {
        // Atualiza status para 'published'
        await supabase
          .from('posts')
          .update({ status: 'published' })
          .eq('id', post.id);
        
        results.push({ id: post.id, status: 'published' });
      } else {
        // Opcional: tratar falhas
        results.push({ id: post.id, status: 'failed' });
      }
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (error: any) {
    console.error('Erro no Cron Job:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
