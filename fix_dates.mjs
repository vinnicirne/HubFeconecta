import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zopjufscdlijljyfveqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcGp1ZnNjZGxpamxqeWZ2ZXFpIiwicm9sZSI6ImFub24ifQ.u1t0qP6-9wH74tN4XN9yvO1mQ8N7P3fTqX8yQZ0lA6M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const { data, error } = await supabase
    .from('posts')
    .update({ scheduled_for: tomorrow.toISOString() })
    .is('scheduled_for', null);

  console.log("Fix done!", error || 'Success');
}

fix();
