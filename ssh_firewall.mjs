import { Client } from 'ssh2';

const conn = new Client();

const commands = 'ufw allow 5678/tcp || true; iptables -I INPUT -p tcp -m tcp --dport 5678 -j ACCEPT || true; ufw reload || true';

conn.on('ready', () => {
  console.log('Client :: ready');
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
}).connect({
  host: '209.50.229.10',
  port: 22,
  username: 'root',
  password: 'Wb2bOyw5xNKmJbns'
});
