import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf8');
  content.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
}
loadEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fixUrls() {
  const { data, error } = await supabase.from('posts').select('id, image_url');
  
  if (data) {
    let fixed = 0;
    for (const post of data) {
      let newUrl = post.image_url;
      
      // Fix 1: localhost -> Vercel (Because Meta cannot download from localhost)
      if (newUrl.includes('localhost:3000')) {
        newUrl = newUrl.replace('http://localhost:3000', 'https://hubfeconecta.vercel.app');
        newUrl = newUrl.replace('https://localhost:3000', 'https://hubfeconecta.vercel.app');
      }
      
      // Fix 2: //api/og -> /api/og
      if (newUrl.includes('hubfeconecta.vercel.app//api')) {
        newUrl = newUrl.replace('hubfeconecta.vercel.app//api', 'hubfeconecta.vercel.app/api');
      }

      if (newUrl !== post.image_url) {
        console.log(`Corrigindo URL do post ${post.id}`);
        await supabase.from('posts').update({ image_url: newUrl }).eq('id', post.id);
        fixed++;
      }
    }
    console.log(`Foram corrigidas as URLs de ${fixed} posts.`);
  }
}

fixUrls();
