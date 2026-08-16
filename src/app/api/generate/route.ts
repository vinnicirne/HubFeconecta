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
    const { type, mediaType = 'IMAGE' } = body; // mediaType: 'IMAGE' | 'REEL'

    const typesToGenerate = type === 'all' 
      ? ['promessa', 'devocional', 'data', 'motivacional', 'pregacao', 'devocional', 'promessa', 'motivacional'] as const
      : [type as 'promessa' | 'devocional' | 'data' | 'motivacional' | 'pregacao'];

    const generatedPosts = [];

    const scheduledHours = [8, 10, 12, 14, 16, 18, 20, 22]; // Horários em BRT (fuso horário do Brasil)
    console.log("🔥 Cobertura 24h Ativada! Horários fixos:", scheduledHours);

    // Ajusta para pegar o 'amanhã' no fuso horário do Brasil (UTC-3)
    const now = new Date();
    now.setHours(now.getHours() - 3); // Simula o fuso do Brasil
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let currentIndex = 0;

    for (const t of typesToGenerate) {
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
        searchParams.set('dateTitle', getFormattedDateTitle(tomorrow));
      }

      imageUrl = `${baseUrl}/api/og?${searchParams.toString()}`;
    }

      // 3. Define a data de agendamento usando a distribuição (considerando BRT = UTC-3)
      const scheduledDate = new Date(tomorrow);
      const hourForThisPost = scheduledHours[currentIndex % scheduledHours.length];
      scheduledDate.setHours(hourForThisPost + 3, 0, 0, 0); // Soma 3 horas para converter BRT -> UTC
      currentIndex++;

      // 4. Save to Supabase (marca como 'pending' e com a data agendada)
      const { data, error } = await supabase
        .from('posts')
        .insert({
          type: t,
          text: content.text,
          reference: content.reference || null,
          author: content.author || null,
          image_url: imageUrl,
          media_type: mediaType,
          status: mediaType === 'REEL' ? 'processing' : 'pending', // Reels start as processing until VPS finishes
          scheduled_for: scheduledDate.toISOString() // Automático!
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
          fetch('http://209.50.229.10:3005/render', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: data.id,
              script: content.text,
              background_keyword: content.background_keyword || 'aesthetic'
            })
          }).catch(err => console.error("VPS Render error:", err)); // fire and forget
        } catch (e) {
          console.error("VPS render request error:", e);
        }
      }

      generatedPosts.push(data);

      // Esperar 4 segundos antes de pedir o próximo para não estourar a cota gratuita do Gemini (15 RPM)
      if (currentIndex < typesToGenerate.length) {
        await new Promise(r => setTimeout(r, 4000));
      }
    }

    return NextResponse.json({ success: true, posts: generatedPosts });

  } catch (error: any) {
    console.error('Generation Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
