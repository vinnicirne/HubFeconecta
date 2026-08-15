import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

import { postToMeta } from '@/lib/meta';

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
