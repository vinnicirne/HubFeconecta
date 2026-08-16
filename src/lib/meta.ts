export async function postToMeta(imageUrl: string, text: string) {
  const token = process.env.META_PAGE_TOKEN;
  if (!token) {
    console.error("Faltando META_PAGE_TOKEN");
    return false;
  }

  try {
    let igUserId = process.env.META_IG_USER_ID;
    
    // Se não tiver o ID nas variáveis, busca na API igual o test_meta.mjs fez
    if (!igUserId) {
      const igReq = await fetch(`https://graph.facebook.com/v20.0/me?fields=instagram_business_account&access_token=${token}`);
      const igRes = await igReq.json();
      igUserId = igRes?.instagram_business_account?.id;
      
      if (!igUserId) {
        console.error("Não foi possível encontrar o ID da conta do Instagram atrelada à página.");
        return false;
      }
    }

    console.log("Enviando para a pagina do Facebook...");
    const fbRes = await fetch(`https://graph.facebook.com/v20.0/me/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrl, message: text, access_token: token })
    });
    const fbData = await fbRes.json();
    if (fbData.error) {
      console.error("Erro Facebook:", fbData.error);
      return false;
    }
    
    if (igUserId) {
      console.log("Subindo imagem pro Instagram...");
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
          const pubReq = await fetch(`https://graph.facebook.com/v20.0/${igUserId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: creationId, access_token: token })
          });
          const pubData = await pubReq.json();
          if (pubData.error) {
            console.error("Erro Instagram:", pubData.error);
            return false;
          }
        } else {
          console.error("Erro Instagram: Tempo esgotado aguardando processamento da imagem.");
          return false;
        }
      }
    }
    return true;
  } catch (error) {
    console.error("Erro geral Meta API:", error);
    return false;
  }
}
