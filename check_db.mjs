import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zopjufscdlijljyfveqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcGp1ZnNjZGxpamxqeWZ2ZXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDA3NzksImV4cCI6MjEwMjI3Njc3OX0.l7XgrBG-ErQND8kpH0C_Nm3rh8PKiYDqD8un72uFjT0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('inbox_messages').select('*').eq('type', 'log').order('created_at', { ascending: false }).limit(5);
  console.log("Qtd Logs:", data?.length);
  if (data?.length > 0) {
    console.log("Ultimo Log:", data[0].message);
    if(data.length > 1) console.log("Penultimo Log:", data[1].message);
  }
}

check();
