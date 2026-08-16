const token = 'EAAdURhkGe7IBSPgmF7H9p8Iet8vSNZC50rTCdieg36iSSuawhVKi5DHCCatdPnSYaxHVne8XBQgrHYlf03ajLsHkv833hlaqAdx8XFN8Iv5mugCagq0xc88RUFu0bq4wzIpnG11qpMuOtRiac24hnOSZCpFqLsydfzGkdt9T7nrDKizVGNxHYZB88naomZCUtH4hizro';
const imageUrl = 'https://hubfeconecta.vercel.app/api/og?type=devocional&text=No+deserto%2C+a+gra%C3%A7a+de+Deus+te+sustenta.+N%C3%A3o+temas+o+amanh%C3%A3%2C+pois+Quem+te+guarda+n%C3%A3o+dorme.+Confie+no+Seu+amor.&avatarUrl=https%3A%2F%2Fgithub.com%2Fshadcn.png&name=DIARIODOCEU&username=%40MEUDIARIODOCEU';
const text = 'No deserto, a graça de Deus te sustenta. Não temas o amanhã, pois Quem te guarda não dorme. Confie no Seu amor.';

async function postToMeta() {
  console.log("Testando envio para o Facebook...");
  const fbRes = await fetch(`https://graph.facebook.com/v20.0/me/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: imageUrl, message: text, access_token: token })
  });
  const fbData = await fbRes.json();
  console.log("Resposta Facebook:", fbData);
  
  console.log("Procurando a conta do Instagram...");
  const igReq = await fetch(`https://graph.facebook.com/v20.0/me?fields=instagram_business_account&access_token=${token}`);
  const igRes = await igReq.json();
  console.log("Conta IG:", igRes);
  const igId = igRes?.instagram_business_account?.id;

  if (igId) {
    console.log("Subindo imagem pro Instagram...");
    const containerReq = await fetch(`https://graph.facebook.com/v20.0/${igId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption: text, access_token: token })
    });
    const containerRes = await containerReq.json();
    console.log("Resposta Container:", containerRes);
    const creationId = containerRes?.id;

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
        const pubReq = await fetch(`https://graph.facebook.com/v20.0/${igId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: creationId, access_token: token })
        });
        const pubData = await pubReq.json();
        console.log("Resposta Publicacao Instagram:", pubData);
      } else {
        console.error("Tempo esgotado aguardando processamento da imagem.");
      }
    }
  }
}

postToMeta();
