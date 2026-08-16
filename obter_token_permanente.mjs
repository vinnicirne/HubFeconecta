// Preencha as 3 variáveis abaixo:
const APP_ID = '2062984881273778';
const APP_SECRET = 'e895711b40fd2a284e89d73901a15516';
const SHORT_LIVED_USER_TOKEN = 'EAAdURhkGe7IBSL1ervqhn8tJ0W3yebh627ESaTec2EDJaug3ZALWBm0ZC1FdKnvKDopFQRuHN94Hm5zpFk1exAvDxOlQHRYsHSZBP6PumYAXa9uflxgN0WSxPqAAEaxpCASRM98NUO8SnFRcKiZAOGWctq6TBX8ZCQuwQ2tayd0XUvVEqWHfrQdmTHquEQnkOJQmcJZAUSBD2anrfFTVuXtwpnU5umMS7pP7DJT0gAp4eHU2EhL7ZCQ8w228nzpZAOdJzJni2OYSbPC6sOUDQ0F8ZAlXq';

async function gerarTokens() {
  if (SHORT_LIVED_USER_TOKEN === 'COLE_AQUI_O_NOVO_TOKEN_DO_EXPLORADOR') {
    console.log("⚠️ ERRO: Você esqueceu de colar o novo token no arquivo!");
    return;
  }

  try {
    console.log("1. Trocando pelo Token de Longa Duração...");
    const exchangeUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${SHORT_LIVED_USER_TOKEN}`;
    const exchangeRes = await fetch(exchangeUrl);
    const exchangeData = await exchangeRes.json();
    const longLivedUserToken = exchangeData.access_token;
    
    if (!longLivedUserToken) {
      console.log("Erro na troca:", exchangeData);
      return;
    }

    console.log("2. Buscando a sua Página do Facebook...");
    const accountsRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${longLivedUserToken}`);
    const accountsData = await accountsRes.json();
    
    if (!accountsData.data || accountsData.data.length === 0) {
      console.log("❌ NENHUMA PÁGINA ENCONTRADA!");
      console.log("Quando você clicou em 'Generate Access Token' no navegador, você não selecionou a sua página, ou ela não está vinculada a essa conta do Facebook.");
      return;
    }
    
    const page = accountsData.data[0];
    const PAGE_TOKEN = page.access_token;
    const PAGE_ID = page.id;
    console.log(`✅ Página Encontrada: ${page.name}`);
    console.log(`\n======================================================`);
    console.log(`🔑 ESTA É A CHAVE DE OURO (PAGE TOKEN) PARA A VERCEL:`);
    console.log(`======================================================\n`);
    console.log(PAGE_TOKEN);
    console.log(`\n======================================================`);
    
    console.log("\n3. Inscrevendo a Página no Webhook automaticamente...");
    const subscribeUrl = `https://graph.facebook.com/v20.0/${PAGE_ID}/subscribed_apps?subscribed_fields=messages,feed&access_token=${PAGE_TOKEN}`;
    const subRes = await fetch(subscribeUrl, { method: "POST" });
    const subData = await subRes.json();
    
    if (subData.success) {
      console.log("✅ PÁGINA ESCRITA COM SUCESSO NO WEBHOOK!");
    } else {
      console.log("❌ Erro ao inscrever no webhook:", subData);
    }
    
  } catch (error) {
    console.error("Erro fatal:", error);
  }
}

gerarTokens();
