import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.META_PAGE_TOKEN;
  
  // Dados simulados (Mock Data) para Fallback ou se não tiver token configurado
  const mockData = {
    followers_count: 1250,
    media_count: 45,
    reach: [
      { date: '01/08', value: 120 },
      { date: '02/08', value: 200 },
      { date: '03/08', value: 150 },
      { date: '04/08', value: 300 },
      { date: '05/08', value: 250 },
      { date: '06/08', value: 400 },
      { date: '07/08', value: 350 }
    ],
    peakHours: [
      { hour: '00h', count: 50 },
      { hour: '04h', count: 10 },
      { hour: '08h', count: 120 },
      { hour: '12h', count: 200 },
      { hour: '16h', count: 180 },
      { hour: '20h', count: 250 }
    ]
  };

  if (!token) {
    return NextResponse.json({ success: true, isMock: true, data: mockData });
  }

  try {
    // 1. Pegar o IG ID
    const igReq = await fetch(`https://graph.facebook.com/v20.0/me?fields=instagram_business_account&access_token=${token}`);
    const igRes = await igReq.json();
    const igId = igRes?.instagram_business_account?.id;
    
    if (!igId) {
      return NextResponse.json({ success: true, isMock: true, error: 'IG_NOT_FOUND', data: mockData });
    }

    // 2. Pegar Infos Básicas
    const infoReq = await fetch(`https://graph.facebook.com/v20.0/${igId}?fields=followers_count,media_count&access_token=${token}`);
    const infoRes = await infoReq.json();

    // 3. Pegar Reach (Últimos 28 dias)
    // O Facebook permite period=day, week, days_28. Vamos pegar days_28 e formatar.
    // Como a API de Insights é bem rigorosa com escopos, se falhar usamos o Mock.
    const reachReq = await fetch(`https://graph.facebook.com/v20.0/${igId}/insights?metric=reach&period=day&access_token=${token}`);
    const reachRes = await reachReq.json();

    if (reachRes.error) {
      console.error("Erro Insights (provavel falta de permissao):", reachRes.error);
      return NextResponse.json({ success: true, isMock: true, error: 'INSIGHTS_ERROR', data: mockData });
    }

    // 4. Pegar Peak Hours
    const onlineReq = await fetch(`https://graph.facebook.com/v20.0/${igId}/insights?metric=online_followers&period=lifetime&access_token=${token}`);
    const onlineRes = await onlineReq.json();
    
    let peakHours = mockData.peakHours;
    if (onlineRes.data && onlineRes.data.length > 0) {
       const rawHours = onlineRes.data[0].values[0].value;
       peakHours = Object.entries(rawHours).map(([hour, count]) => {
         const brtHour = (parseInt(hour) + 4) % 24;
         return { hour: `${brtHour}h`, count: count as number };
       }).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    }

    // Parse Reach Data
    let reachData = mockData.reach;
    if (reachRes.data && reachRes.data.length > 0) {
      reachData = reachRes.data[0].values.map((v: any) => {
        const d = new Date(v.end_time);
        return {
          date: `${d.getDate()}/${d.getMonth()+1}`,
          value: v.value
        };
      });
    }

    const realData = {
      followers_count: infoRes.followers_count || mockData.followers_count,
      media_count: infoRes.media_count || mockData.media_count,
      reach: reachData,
      peakHours: peakHours
    };

    return NextResponse.json({ success: true, isMock: false, data: realData });

  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ success: true, isMock: true, error: error.message, data: mockData });
  }
}
