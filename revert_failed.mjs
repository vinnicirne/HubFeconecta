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

async function revert() {
  // Buscar os posts que estão com status = published mas não foram pro ar de fato hoje
  // Sabemos que a imagem deles estava gerada com localhost ou 209.50.229.10
  const { data, error } = await supabase.from('posts').select('*').eq('status', 'published');
  
  if (data) {
    let reverted = 0;
    for (const post of data) {
      if (post.image_url.includes('localhost') || post.image_url.includes('209.50.229.10')) {
        console.log(`Revertendo post ${post.id}`);
        // Voltar pra pending, e arrumar a url pra Vercel
        const newUrl = post.image_url.replace('209.50.229.10:3000', 'hubfeconecta.vercel.app').replace('http://', 'https://');
        await supabase.from('posts').update({ status: 'pending', image_url: newUrl }).eq('id', post.id);
        reverted++;
      }
    }
    console.log(`Foram revertidos ${reverted} posts.`);
  }
}

revert();
