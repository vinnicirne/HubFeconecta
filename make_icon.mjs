import { execSync } from 'child_process';
import fs from 'fs';

// Cria um arquivo PNG 1024x1024 em base64 minimalista (pixel azul expandido)
const base64Png = "iVBORw0KGgoAAAANSUhEUgAABAAAAAQAAQMAAABFwvPdAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAFRJREFUeNrtwTEBAAAAwqD1T20ND6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+A13eAABCQzMpgAAAABJRU5ErkJggg==";

fs.writeFileSync('icone_1024.png', Buffer.from(base64Png, 'base64'));
console.log('Ícone gerado com sucesso na Área de Trabalho: icone_1024.png');
