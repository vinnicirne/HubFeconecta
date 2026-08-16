import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zopjufscdlijljyfveqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcGp1ZnNjZGxpamxqeWZ2ZXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDA3NzksImV4cCI6MjEwMjI3Njc3OX0.l7XgrBG-ErQND8kpH0C_Nm3rh8PKiYDqD8un72uFjT0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checando inbox_messages...");
  const { data: inbox, error: err1 } = await supabase.from('inbox_messages').select('*');
  console.log("Inbox:", inbox, err1);

  console.log("Checando automations...");
  const { data: automations, error: err2 } = await supabase.from('automations').select('*');
  console.log("Automations:", automations, err2);
}

check();
