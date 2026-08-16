import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { postToMeta } from '@/lib/meta';

export const maxDuration = 60; // Allow enough time for IG processing

export async function POST(req: Request) {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json({ success: false, error: 'Post ID is required' }, { status: 400 });
    }

    // Busca o post
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    if (post.status === 'published') {
      return NextResponse.json({ success: false, error: 'Post is already published' }, { status: 400 });
    }

    if (post.status === 'processing') {
      return NextResponse.json({ success: false, error: 'O vídeo ainda está sendo gerado pela IA. Aguarde alguns minutos.' }, { status: 400 });
    }

    console.log(`Publicando manualmente o post ID: ${post.id}`);
    
    const isPosted = await postToMeta(post.image_url, post.text, post.media_type, post.video_url);

    if (isPosted) {
      // Atualiza status para 'published' e remove agendamento (já que foi publicado agora)
      await supabase
        .from('posts')
        .update({ status: 'published', scheduled_for: null })
        .eq('id', post.id);
      
      return NextResponse.json({ success: true, message: 'Post publicado com sucesso!' });
    } else {
      return NextResponse.json({ success: false, error: 'Falha ao publicar na Meta.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Publish-Now Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
