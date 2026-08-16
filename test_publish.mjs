import fs from 'fs';

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

async function testPublish() {
  const token = process.env.META_PAGE_TOKEN;
  const imageUrl = "https://zopjufscdlijljyfveqi.supabase.co/storage/v1/object/public/posts/1723689400827.jpg";
  const text = "Teste manual de publish";

  console.log("Enviando para a pagina do Facebook...");
  const fbRes = await fetch(`https://graph.facebook.com/v20.0/me/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: imageUrl, message: text, access_token: token })
  });
  const fbData = await fbRes.json();
  console.log("Facebook Response:", fbData);
  
  console.log("Procurando a conta do Instagram...");
  const igReq = await fetch(`https://graph.facebook.com/v20.0/me?fields=instagram_business_account&access_token=${token}`);
  const igRes = await igReq.json();
  const igId = igRes?.instagram_business_account?.id;
  console.log("Instagram ID:", igId);

  if (igId) {
    console.log("Subindo imagem pro Instagram...");
    const containerReq = await fetch(`https://graph.facebook.com/v20.0/${igId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption: text, access_token: token })
    });
    const containerRes = await containerReq.json();
    console.log("Container Response:", containerRes);
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
        console.log("Publish Response:", pubData);
      } else {
        console.error("Erro Instagram: Tempo esgotado aguardando processamento da imagem.");
      }
    }
  }
}

testPublish();
