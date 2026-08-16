import { Client } from 'ssh2';
import fs from 'fs';

const flow = fs.readFileSync('c:\\Users\\THINKPAD\\Desktop\\Diário do Céu\\n8n_generate_daily.json', 'utf8');
const flow2 = fs.readFileSync('c:\\Users\\THINKPAD\\Desktop\\Diário do Céu\\n8n_publish_5min.json', 'utf8');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(`echo '${flow.replace(/'/g, "'\\''")}' > /tmp/n8n_gen.json && echo '${flow2.replace(/'/g, "'\\''")}' > /tmp/n8n_pub.json && docker cp /tmp/n8n_gen.json diariodoceu-n8n-n8n-1:/tmp/n8n_gen.json && docker cp /tmp/n8n_pub.json diariodoceu-n8n-n8n-1:/tmp/n8n_pub.json && docker exec diariodoceu-n8n-n8n-1 n8n import:workflow --input=/tmp/n8n_gen.json && docker exec diariodoceu-n8n-n8n-1 n8n import:workflow --input=/tmp/n8n_pub.json`, (err, stream) => {
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
}).connect({
  host: '209.50.229.10',
  port: 22,
  username: 'root',
  password: 'Wb2bOyw5xNKmJbns'
});
