import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Carrega as vars de ambiente locais
function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf8');
  content.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
}
loadEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function postToMeta(imageUrl, text) {
  const token = process.env.META_PAGE_TOKEN;
  if (!token) {
    console.error("Faltando META_PAGE_TOKEN");
    return false;
  }

  let igUserId = process.env.META_IG_USER_ID;
  if (!igUserId) {
    const igReq = await fetch(`https://graph.facebook.com/v20.0/me?fields=instagram_business_account&access_token=${token}`);
    const igRes = await igReq.json();
    igUserId = igRes?.instagram_business_account?.id;
    if (!igUserId) return false;
  }

  try {
    const fbRes = await fetch(`https://graph.facebook.com/v20.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: text,
        access_token: token
      })
    });
    
    const fbData = await fbRes.json();
    if (fbData.error) {
      console.error("Erro Facebook:", fbData.error);
      return false;
    }
    
    const containerReq = await fetch(`https://graph.facebook.com/v20.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption: text, access_token: token })
    });
    
    const containerRes = await containerReq.json();
    if (containerRes.error) {
      console.error("Erro Container Instagram:", containerRes.error);
      return false;
    }
    const creationId = containerRes.id;

    if (creationId) {
      console.log("Aguardando o Instagram processar a imagem...");
      let isReady = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const statusReq = await fetch(`https://graph.facebook.com/v20.0/${creationId}?fields=status_code&access_token=${token}`);
        const statusRes = await statusReq.json();
        console.log(`Status (${i+1}/10):`, statusRes.status_code);
        if (statusRes.status_code === 'FINISHED') {
          isReady = true;
          break;
        }
      }

      if (isReady) {
        console.log("Publicando no Instagram...");
        const publishRes = await fetch(`https://graph.facebook.com/v20.0/${igUserId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: token
          })
        });
        
        const publishData = await publishRes.json();
        if (publishData.error) {
          console.error("Erro Publicação Meta:", publishData.error);
          return false;
        }
        return true;
      } else {
        console.error("Tempo esgotado aguardando o processamento do Instagram.");
        return false;
      }
    }
  } catch (error) {
    console.error("Erro na comunicação com a API do Meta:", error);
    return false;
  }
}

async function runCron() {
  const { data: postsToPublish, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'pending')
    .not('scheduled_for', 'is', null)
    .lte('scheduled_for', new Date().toISOString());

  if (error) {
    console.error('Erro ao buscar posts:', error.message);
    return;
  }

  if (!postsToPublish || postsToPublish.length === 0) {
    console.log('Nenhum post atrasado/agendado para publicar agora.');
    return;
  }

  console.log(`Encontrados ${postsToPublish.length} posts para publicar.`);

  for (const post of postsToPublish) {
    console.log(`Publicando post ID: ${post.id}`);
    const isPosted = await postToMeta(post.image_url, post.text);
    if (isPosted) {
      await supabase.from('posts').update({ status: 'published' }).eq('id', post.id);
      console.log(`Post ${post.id} publicado com sucesso.`);
    } else {
      console.log(`Falha ao publicar post ${post.id}.`);
    }
  }
}

runCron();
