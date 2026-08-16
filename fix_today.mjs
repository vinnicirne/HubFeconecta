import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zopjufscdlijljyfveqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcGp1ZnNjZGxpamxqeWZ2ZXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDA3NzksImV4cCI6MjEwMjI3Njc3OX0.l7XgrBG-ErQND8kpH0C_Nm3rh8PKiYDqD8un72uFjT0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  // get 4 latest posts
  const { data, error } = await supabase.from('posts').select('id, type').order('created_at', { ascending: false }).limit(4);
  
  if (data) {
    for (const p of data) {
      let brtHour = 12;
      if (p.type === 'promessa') brtHour = 15;
      if (p.type === 'devocional') brtHour = 18;
      if (p.type === 'pregacao') brtHour = 21;
      
      const dt = new Date('2026-08-15T00:00:00.000Z');
      dt.setUTCHours(brtHour + 3, 0, 0, 0); // 12 + 3 = 15 UTC
      
      console.log(`Fixing ${p.id} to ${dt.toISOString()}`);
      await supabase.from('posts').update({ scheduled_for: dt.toISOString() }).eq('id', p.id);
    }
  }
}

fix();
