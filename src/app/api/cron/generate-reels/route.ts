import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

export const maxDuration = 60; // 1 minuto na Vercel Hobby

function getFormattedDateTitle(date: Date) {
  const optionsWeekday: Intl.DateTimeFormatOptions = { weekday: 'long' };
  const optionsDayMonth: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  
  const weekday = date.toLocaleDateString('pt-BR', optionsWeekday).toUpperCase();
  const dayMonth = date.toLocaleDateString('pt-BR', optionsDayMonth).toUpperCase();
  
  return `${weekday}, ${dayMonth}`;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const typesToGenerate = ['promessa', 'devocional', 'data', 'motivacional', 'pregacao', 'devocional', 'promessa', 'motivacional'] as const;
    const mediaType = 'REEL';
    const scheduledHours = [8, 10, 12, 14, 16, 18, 20, 22]; 

    const now = new Date();
    now.setHours(now.getHours() - 3);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let currentIndex = 0;
    const generatedPosts = [];

    for (const t of typesToGenerate) {
      const content = await generateContent(t, mediaType);
      
      const scheduledDate = new Date(tomorrow);
      const hourForThisPost = scheduledHours[currentIndex % scheduledHours.length];
      scheduledDate.setHours(hourForThisPost + 3, 0, 0, 0);
      currentIndex++;

      const { data, error } = await supabase
        .from('posts')
        .insert({
          type: t,
          text: content.text,
          reference: content.reference || null,
          author: content.author || null,
          media_type: mediaType,
          status: 'processing',
          scheduled_for: scheduledDate.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase Insert Error:', error);
        continue;
      }

      // Envia para a VPS renderizar
      try {
        fetch('http://209.50.229.10:3001/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.id,
            script: content.text,
            background_keyword: content.background_keyword || 'aesthetic'
          })
        }).catch(err => console.error("VPS Render error:", err));
      } catch (e) {
        console.error("VPS render request error:", e);
      }

      generatedPosts.push(data);
      if (currentIndex < typesToGenerate.length) await new Promise(r => setTimeout(r, 4000));
    }

    return NextResponse.json({ success: true, count: generatedPosts.length });

  } catch (error: any) {
    console.error('Cron Generation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
