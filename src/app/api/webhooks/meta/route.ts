import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Essa é a senha de verificação do Webhook que você vai colar lá no painel do Meta
const VERIFY_TOKEN = 'diariodoceu_premium_2026';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK VERIFIED!');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("=== WEBHOOK RECEBIDO DO META ===");
    console.log(JSON.stringify(body, null, 2));

    if (body.object === 'instagram' || body.object === 'page') {
      const platform = body.object;
      
      for (const entry of body.entry) {
        // Direct Messages / Messenger
        if (entry.messaging) {
          for (const event of entry.messaging) {
            if (event.message && event.message.text) {
              const senderId = event.sender.id;
              const text = event.message.text;

              // Salva no banco de dados Inbox
              await supabase.from('inbox_messages').insert({
                platform,
                type: 'direct',
                sender_id: senderId,
                message: text,
              });

              // AUTOMAÇÃO DO "QUERO" NO DIRECT (Exemplo de resposta)
              if (text.toLowerCase().includes('quero')) {
                await sendDirectReply(senderId, "Olá! Recebemos o seu 'quero'. Aqui está o link: https://hubfeconecta.vercel.app/ 🎉");
              }
            }
          }
        }
        
        // Comentários (Changes)
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'comments' && change.value) {
              const comment = change.value;
              const senderId = comment.from.id;
              const senderName = comment.from.username || comment.from.name;
              const text = comment.text;
              const postId = comment.media?.id || comment.post_id;
              const commentId = comment.id;

              // Só salvar se não for o próprio dono comentando
              // (Geralmente a API manda tudo, é bom filtrar)

              await supabase.from('inbox_messages').insert({
                platform,
                type: 'comment',
                sender_id: senderId,
                sender_name: senderName,
                message: text,
                post_id: postId,
              });

              // AUTOMAÇÃO DO "QUERO" NOS COMENTÁRIOS
              if (text.toLowerCase().includes('quero')) {
                // 1. Responde o comentário publicamente
                await replyToComment(commentId, "Te enviei todas as informações no Direct! ❤️");
                // 2. Envia um direct privado para a pessoa
                // A API do Instagram permite responder no direct até 24h após um comentário
                await sendDirectReply(commentId, "Oi! Vi que você comentou 'quero'. Aqui está o seu presente especial! 🎁");
              }
            }
          }
        }
      }
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    } else {
      return new NextResponse('NOT_FOUND', { status: 404 });
    }
  } catch (error) {
    console.error("Erro no Webhook:", error);
    return new NextResponse('ERROR', { status: 500 });
  }
}

// Funções utilitárias para a Automação
async function sendDirectReply(recipientId: string, text: string) {
  const token = process.env.META_PAGE_TOKEN;
  if (!token) return;

  const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${token}`;
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId }, // Funciona para responder comments enviando o comment_id também no lugar de sender
      message: { text }
    })
  });
}

async function replyToComment(commentId: string, text: string) {
  const token = process.env.META_PAGE_TOKEN;
  if (!token) return;

  const url = `https://graph.facebook.com/v20.0/${commentId}/replies`;
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: text,
      access_token: token
    })
  });
}
