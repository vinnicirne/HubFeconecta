import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zopjufscdlijljyfveqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcGp1ZnNjZGxpamxqeWZ2ZXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDA3NzksImV4cCI6MjEwMjI3Njc3OX0.l7XgrBG-ErQND8kpH0C_Nm3rh8PKiYDqD8un72uFjT0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('posts').select('id, status, scheduled_for, created_at, text').order('created_at', { ascending: false });
  data.forEach(p => {
      const pDate = new Date(p.scheduled_for || p.created_at);
      console.log(`[${p.status}] ID: ${p.id.slice(0,5)} | Sched: ${p.scheduled_for} | Text: ${p.text.substring(0, 30).replace(/\n/g, ' ')}`);
  });
}

check();
