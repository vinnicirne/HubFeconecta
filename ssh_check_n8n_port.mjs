import { Client } from 'ssh2';

const conn = new Client();
const commands = 'docker logs --tail 30 diariodoceu-n8n-n8n-1 && docker ps | grep n8n';

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code);
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
