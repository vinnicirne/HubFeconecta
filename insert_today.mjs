import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zopjufscdlijljyfveqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcGp1ZnNjZGxpamxqeWZ2ZXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDA3NzksImV4cCI6MjEwMjI3Njc3OX0.l7XgrBG-ErQND8kpH0C_Nm3rh8PKiYDqD8un72uFjT0';
const supabase = createClient(supabaseUrl, supabaseKey);

const posts = [
  {
    type: 'motivacional',
    text: 'Mesmo que a caminhada pareça difícil, lembre-se: Deus está moldando você para suportar o peso da sua vitória. Continue firme!',
    author: 'Diário do Céu',
    reference: null,
    hour: 12,
    utcHour: 15,
    dateOffset: 0
  },
  {
    type: 'promessa',
    text: 'Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de lhes causar dano, planos de dar-lhes esperança e um futuro.',
    author: null,
    reference: 'Jeremias 29:11',
    hour: 15,
    utcHour: 18,
    dateOffset: 0
  },
  {
    type: 'devocional',
    text: 'Às vezes Deus acalma a tempestade, outras vezes Ele acalma você. Descanse no colo do Pai e deixe que Ele cuide daquilo que você não pode controlar.',
    author: 'Diário do Céu',
    reference: null,
    hour: 18,
    utcHour: 21,
    dateOffset: 0
  },
  {
    type: 'pregacao',
    text: 'Você não foi chamado para entender tudo o que Deus faz, você foi chamado para confiar nEle em tudo o que Ele faz!',
    author: 'Diário do Céu',
    reference: null,
    hour: 21,
    utcHour: 0,
    dateOffset: 1 // Next day in UTC
  }
];

async function insertPosts() {
  const now = new Date('2026-08-15T00:00:00.000Z'); // Fixed base date for "today" in UTC
  
  for (const p of posts) {
    const scheduledDate = new Date(now);
    scheduledDate.setDate(scheduledDate.getDate() + p.dateOffset);
    scheduledDate.setHours(p.utcHour, 0, 0, 0);

    const params = new URLSearchParams();
    params.set('type', p.type);
    params.set('text', p.text);
    if (p.reference) params.set('reference', p.reference);
    if (p.author) params.set('author', p.author);
    
    const imageUrl = `https://hubfeconecta.vercel.app/api/og?${params.toString()}`;

    const { data, error } = await supabase
      .from('posts')
      .insert({
        type: p.type,
        text: p.text,
        reference: p.reference,
        author: p.author,
        image_url: imageUrl,
        status: 'pending',
        scheduled_for: scheduledDate.toISOString()
      });

    if (error) {
      console.error(`Error inserting ${p.hour}:00`, error);
    } else {
      console.log(`Successfully scheduled post for ${p.hour}:00 BRT (${scheduledDate.toISOString()})`);
    }
  }
}

insertPosts();
