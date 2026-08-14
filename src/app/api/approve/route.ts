import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json({ success: false, error: 'Post ID is required' }, { status: 400 });
    }

    // 1. Fetch post from Supabase
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    // 2. Trigger Ayrshare/n8n Webhook
    const webhookUrl = process.env.DISTRIBUTION_WEBHOOK_URL;
    
    if (webhookUrl) {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: post.text,
          image_url: post.image_url,
          type: post.type,
          // Se for Ayrshare nativo, o payload de envio seria estruturado aqui.
          // Para n8n genérico, apenas repassamos o payload.
        })
      });

      if (!webhookResponse.ok) {
        throw new Error('Failed to trigger webhook');
      }
    } else {
      console.warn('DISTRIBUTION_WEBHOOK_URL not set. Skipping webhook trigger, just updating status.');
    }

    // 3. Update status to posted (or scheduled)
    const { error: updateError } = await supabase
      .from('posts')
      .update({ status: 'posted' })
      .eq('id', postId);

    if (updateError) {
      throw new Error('Failed to update post status');
    }

    return NextResponse.json({ success: true, message: 'Post approved and sent to distribution' });
  } catch (error: any) {
    console.error('Approve Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
