import { Client } from 'ssh2';
import fs from 'fs';

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const readStream = fs.createReadStream('c:\\Users\\THINKPAD\\Desktop\\Diário do Céu\\vps_renderer.mjs');
    const writeStream = sftp.createWriteStream('/root/vps_renderer.mjs');
    
    writeStream.on('close', () => {
      console.log('File uploaded successfully');
      
      const commands = `
        cd /root
        npm init -y
        npm install express cors dotenv @supabase/supabase-js
        npm install -g pm2
        pm2 stop vps_renderer || true
        pm2 start vps_renderer.mjs
        pm2 save
      `;
      
      conn.exec(commands, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          conn.end();
        }).on('data', (data) => {
          console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
          console.log('STDERR: ' + data);
        });
      });
    });
    
    readStream.pipe(writeStream);
  });
}).connect({
  host: '209.50.229.10',
  port: 22,
  username: 'root',
  password: 'Wb2bOyw5xNKmJbns'
});
