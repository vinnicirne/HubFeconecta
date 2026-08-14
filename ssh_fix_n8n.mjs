import { Client } from 'ssh2';

const conn = new Client();

const dockerComposeYaml = `version: "3.7"
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=hubfeconecta.vps9432.panel.icontainer.cloud
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://hubfeconecta.vps9432.panel.icontainer.cloud/
      - GENERIC_TIMEZONE=America/Sao_Paulo
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
`;

const base64Yaml = Buffer.from(dockerComposeYaml).toString('base64');

const commands = [
  `echo '${base64Yaml}' | base64 -d > /opt/diariodoceu-n8n/docker-compose.yml`,
  'cd /opt/diariodoceu-n8n && docker compose pull && docker compose up -d'
].join(' && ');

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
