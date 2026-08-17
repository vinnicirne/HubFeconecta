import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

export const maxDuration = 60; // Permite que a Vercel Hobby rode a API por até 1 minuto para gerar os 8 posts

// Helper for generating formatted date string like "TERÇA-FEIRA, 5 DE AGOSTO"
function getFormattedDateTitle(date: Date) {
  const optionsWeekday: Intl.DateTimeFormatOptions = { weekday: 'long' };
  const optionsDayMonth: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  
  const weekday = date.toLocaleDateString('pt-BR', optionsWeekday).toUpperCase();
  const dayMonth = date.toLocaleDateString('pt-BR', optionsDayMonth).toUpperCase();
  
  return `${weekday}, ${dayMonth}`;
}

// Função postToMeta foi movida para o Cron Job

async function getPeakHours(token: string): Promise<number[] | null> {
  try {
    const igReq = await fetch(`https://graph.facebook.com/v20.0/me?fields=instagram_business_account&access_token=${token}`);
    const igRes = await igReq.json();
    const igId = igRes?.instagram_business_account?.id;
    
    if (!igId) return null;

    const insightsReq = await fetch(`https://graph.facebook.com/v20.0/${igId}/insights?metric=online_followers&period=lifetime&access_token=${token}`);
    const insightsRes = await insightsReq.json();
    
    if (insightsRes.error || !insightsRes.data || insightsRes.data.length === 0) {
       console.error("Insights API erro ou sem dados (Token provavelmente sem permissao de read_insights):", insightsRes.error);
       return null;
    }

    const onlineData = insightsRes.data[0].values[0].value;
    
    const convertedHours = [];
    for (const [hourStr, count] of Object.entries(onlineData)) {
      const pstHour = parseInt(hourStr, 10);
      // PDT (Pacific Daylight Time) é UTC-7. BRT (Brasília Time) é UTC-3. Diferença de +4 horas.
      let brtHour = (pstHour + 4) % 24;
      convertedHours.push({ hour: brtHour, count: count as number });
    }

    // Ordenar do maior número de seguidores online para o menor
    convertedHours.sort((a, b) => b.count - a.count);

    // Pegar as top 5 horas
    const top5 = convertedHours.slice(0, 5).map(h => h.hour);
    // Ordenar cronologicamente para postar em ordem no dia
    top5.sort((a, b) => a - b);
    
    return top5.length === 5 ? top5 : null;
  } catch(e) {
    console.error("Erro ao pegar peak hours:", e);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, mediaType = 'IMAGE', isAuto = false, hourIndex } = body;

    const scheduledHours = [8, 10, 12, 14, 16, 18, 20, 22]; // Horários em BRT
    const typesSequence = ['promessa', 'devocional', 'data', 'motivacional', 'pregacao', 'devocional', 'promessa', 'motivacional'] as const;

    // DETECÇÃO DE AUTOMAÇÃO N8N (N8N envia type: 'all' mas não envia hourIndex)
    if (type === 'all' && hourIndex === undefined) {
      console.log("[AUTO N8N] Iniciando geracao em lote (8 Reels) via backend...");
      const results = [];
      // Roda o loop 8 vezes diretamente no servidor da Vercel
      for (let i = 0; i < scheduledHours.length; i++) {
        try {
          const res = await fetch(req.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'all',
              mediaType: 'REEL',
              isAuto: true, // Auto agenda para o mesmo dia (já que roda a meia-noite)
              hourIndex: i
            })
          });
          const data = await res.json();
          results.push(data);
        } catch (e) {
          console.error(`Erro na iteracao ${i} do n8n batch:`, e);
        }
      }
      return NextResponse.json({ success: true, message: "Lote de 8 Reels gerado via n8n", results });
    }

    const currentHourIndex = hourIndex ?? 0;

    // Determina o tipo. Se for 'auto', escolhe aleatoriamente ou sequencial
    let t: any = type;
    if (type === 'all') {
      t = typesSequence[currentHourIndex % typesSequence.length];
    } else if (type === 'auto') {
      t = typesSequence[Math.floor(Math.random() * typesSequence.length)];
    }

    // Define a data alvo (UTC-3 Brasil)
    const now = new Date();
    now.setHours(now.getHours() - 3); 
    
    const targetDate = new Date(now);
    // Se for gerado pelo painel (manual em lote), agenda para amanhã. Se for pelo n8n (isAuto), agenda para hoje.
    if (!isAuto) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    const hourForThisPost = scheduledHours[currentHourIndex % scheduledHours.length];
    targetDate.setHours(hourForThisPost + 3, 0, 0, 0); // Volta pra UTC

    // 1. Generate text with Gemini
    const content = await generateContent(t, mediaType as 'IMAGE' | 'REEL');
    
    // 2. Prepare OG Image URL params (Only for IMAGE)
    let imageUrl = null;
    if (mediaType === 'IMAGE') {
      let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hubfeconecta.vercel.app';
      if (baseUrl.includes('localhost')) {
        baseUrl = 'https://hubfeconecta.vercel.app';
      }
      
      const searchParams = new URLSearchParams({
        type: t,
        text: content.text,
        avatarUrl: process.env.NEXT_PUBLIC_AVATAR_URL || 'https://github.com/shadcn.png',
        name: process.env.NEXT_PUBLIC_NAME || 'DIARIODOCEU',
        username: process.env.NEXT_PUBLIC_USERNAME || '@MEUDIARIODOCEU',
      });

      if (t === 'promessa' && content.reference) {
        searchParams.set('reference', content.reference);
      }
      if (t === 'pregacao' && content.author) {
        searchParams.set('author', content.author);
      }
      if (t === 'data') {
        searchParams.set('dateTitle', getFormattedDateTitle(targetDate));
      }

      imageUrl = `${baseUrl}/api/og?${searchParams.toString()}`;
    }

    // 4. Save to Supabase
    const { data, error } = await supabase
      .from('posts')
      .insert({
        type: t,
        text: content.text,
        reference: content.reference || null,
        author: content.author || null,
        image_url: imageUrl,
        media_type: mediaType,
        status: mediaType === 'REEL' ? 'processing' : 'pending',
        scheduled_for: targetDate.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw new Error('Database insertion failed');
    }

    // If it's a REEL, call the VPS renderer!
    if (mediaType === 'REEL') {
      try {
        await fetch('http://209.50.229.10:3005/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.id,
            script: content.text,
            background_keyword: content.background_keyword || 'aesthetic'
          })
        });
      } catch (e) {
        console.error("VPS render request error:", e);
      }
    }

    return NextResponse.json({ success: true, posts: [data] });

  } catch (error: any) {
    console.error('Generation Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
