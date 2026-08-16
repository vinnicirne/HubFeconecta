import express from 'express';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const execAsync = util.promisify(exec);
const app = express();
app.use(express.json());

const ELEVENLABS_API_KEY = "sk_bbd4ccdfe2543523ee37aa0dbc696a458a98f0a60b7f4782";
const PEXELS_API_KEY = "hHQmTOHIOrkAnWWNCFdPjFP4n2iwCVOsmQXCH1C6i1O2WXrxajv74Gln";

// We need SUPABASE keys to upload the final video
// We will pass these via env vars when running the script
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.post('/render', async (req, res) => {
  const { id, script, background_keyword } = req.body;
  if (!id || !script) return res.status(400).json({ error: "Missing id or script" });

  res.json({ message: "Rendering started", id }); // Respond immediately

  try {
    console.log(`[${id}] Starting render process...`);
    const workDir = `/tmp/${id}`;
    if (!fs.existsSync(workDir)) fs.mkdirSync(workDir);

    const audioPath = path.join(workDir, 'audio.mp3');
    const videoPath = path.join(workDir, 'bg.mp4');
    const srtPath = path.join(workDir, 'subs.srt');
    const outputPath = path.join(workDir, 'final.mp4');

    // 1. Generate TTS with ElevenLabs (Voice: Adam or similar deep voice)
    console.log(`[${id}] Fetching ElevenLabs TTS...`);
    const voiceId = "pNInz6obpgDQGcFmaJgB"; // Adam (Deep, narrator)
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });
    
    if (!ttsRes.ok) throw new Error("ElevenLabs API failed: " + await ttsRes.text());
    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
    fs.writeFileSync(audioPath, audioBuffer);

    // 2. Fetch Pexels Video
    console.log(`[${id}] Fetching Pexels video...`);
    const pexelsRes = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(background_keyword || 'nature aesthetic')}&orientation=portrait&size=large&per_page=15`, {
      headers: { Authorization: PEXELS_API_KEY }
    });
    const pexelsData = await pexelsRes.json();
    if (!pexelsData.videos || pexelsData.videos.length === 0) throw new Error("No videos found on Pexels");
    
    // Pick a random video
    const randomVid = pexelsData.videos[Math.floor(Math.random() * pexelsData.videos.length)];
    const videoLink = randomVid.video_files.find(f => f.quality === 'hd' && f.height >= 1080)?.link || randomVid.video_files[0].link;
    
    console.log(`[${id}] Downloading video from Pexels...`);
    const vidRes = await fetch(videoLink);
    const vidBuffer = Buffer.from(await vidRes.arrayBuffer());
    fs.writeFileSync(videoPath, vidBuffer);

    // 3. Generate Simple SRT Subtitles
    console.log(`[${id}] Generating subtitles...`);
    const words = script.split(' ');
    let srtContent = "";
    let srtIndex = 1;
    let currentWords = [];
    let currentTimeMs = 0;
    
    // Estimate 250ms per word (slow reflective pace)
    const msPerWord = 250; 

    function formatTime(ms) {
      const date = new Date(ms);
      const hh = String(date.getUTCHours()).padStart(2, '0');
      const mm = String(date.getUTCMinutes()).padStart(2, '0');
      const ss = String(date.getUTCSeconds()).padStart(2, '0');
      const msStr = String(date.getUTCMilliseconds()).padStart(3, '0');
      return `${hh}:${mm}:${ss},${msStr}`;
    }

    for (let i = 0; i < words.length; i++) {
      currentWords.push(words[i]);
      // Group every 6 words
      if (currentWords.length >= 6 || i === words.length - 1) {
        const startTime = formatTime(currentTimeMs);
        currentTimeMs += (currentWords.length * msPerWord) + 1500; // +1.5s pause per chunk
        const endTime = formatTime(currentTimeMs);
        
        srtContent += `${srtIndex}\n${startTime} --> ${endTime}\n${currentWords.join(' ')}\n\n`;
        srtIndex++;
        currentWords = [];
      }
    }
    fs.writeFileSync(srtPath, srtContent);

    // 4. Run FFmpeg
    console.log(`[${id}] Running FFmpeg...`);
    // Command: 
    // -stream_loop -1 to loop video if short
    // -i video -i audio
    // -vf subtitles=subs.srt with a nice style
    // -c:v libx264 -c:a aac -shortest
    // Note: the font might need to be specified, but default usually works if we don't force a specific custom font.
    // To make it safe across OS, we use force_style to make it readable.
    
    const ffmpegCmd = `ffmpeg -stream_loop -1 -i "${videoPath}" -i "${audioPath}" -vf "subtitles=${srtPath}:force_style='Fontsize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=0,MarginV=120'" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -shortest -y "${outputPath}"`;
    
    await execAsync(ffmpegCmd);
    
    // 5. Upload to Supabase
    console.log(`[${id}] Uploading to Supabase...`);
    const fileBuffer = fs.readFileSync(outputPath);
    const uploadRes = await supabase.storage.from('reels').upload(`public/${id}.mp4`, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true
    });
    
    if (uploadRes.error) throw new Error("Supabase Upload Error: " + uploadRes.error.message);
    
    const { data: publicUrlData } = supabase.storage.from('reels').getPublicUrl(`public/${id}.mp4`);
    const finalUrl = publicUrlData.publicUrl;

    console.log(`[${id}] Updating database with URL: ${finalUrl}`);
    await supabase.from('posts').update({ video_url: finalUrl, status: 'pending' }).eq('id', id);

    console.log(`[${id}] Done!`);
    
    // Cleanup
    fs.rmSync(workDir, { recursive: true, force: true });

  } catch (error) {
    console.error(`[${id}] Error:`, error);
  }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Renderer server running on port ${PORT}`);
});
