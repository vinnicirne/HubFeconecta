import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

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
    const { type } = body; // Can be a specific type or 'all'

    const typesToGenerate = type === 'all' 
      ? ['promessa', 'devocional', 'data', 'motivacional', 'pregacao', 'devocional', 'promessa', 'motivacional'] as const
      : [type as 'promessa' | 'devocional' | 'data' | 'motivacional' | 'pregacao'];

    const generatedPosts = [];

    // Para cobrir 24h, agendamos de 3 em 3 horas fixo:
    // 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00
    const scheduledHours = [0, 3, 6, 9, 12, 15, 18, 21];
    console.log("🔥 Cobertura 24h Ativada! Horários fixos de 3 em 3h:", scheduledHours);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    let currentIndex = 0;

    for (const t of typesToGenerate) {
      // 1. Generate text with Gemini
      const content = await generateContent(t);
      
      // 2. Prepare OG Image URL params
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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

      const imageUrl = `${baseUrl}/api/og?${searchParams.toString()}`;

      // 3. Define a data de agendamento usando a distribuição 24h
      const scheduledDate = new Date(tomorrow);
      const hourForThisPost = scheduledHours[currentIndex % scheduledHours.length];
      scheduledDate.setHours(hourForThisPost, 0, 0, 0);
      currentIndex++;

      // 4. Save to Supabase (marca como 'pending' e com a data agendada)
      const finalImageUrl = imageUrl.replace('localhost', '209.50.229.10');
      const { data, error } = await supabase
        .from('posts')
        .insert({
          type: t,
          text: content.text,
          reference: content.reference || null,
          author: content.author || null,
          image_url: finalImageUrl,
          status: 'pending',
          scheduled_for: scheduledDate.toISOString() // Automático!
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase Insert Error:', error);
        throw new Error('Database insertion failed');
      }

      generatedPosts.push(data);
    }

    return NextResponse.json({ success: true, posts: generatedPosts });

  } catch (error: any) {
    console.error('Generation Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
