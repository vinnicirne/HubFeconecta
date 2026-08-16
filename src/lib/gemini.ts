import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || 'dummy_key';
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_PROMPT_IMAGE = `Você é um gerador de conteúdo cristão para o aplicativo "Diário do Céu".
REGRA CRÍTICA: O texto gerado deve ser conciso e impactante.
MÁXIMO DE 35 A 40 PALAVRAS. O texto deve caber em cerca de 5 a 6 linhas visuais.
Seja direto e impactante. Nunca crie textos longos.
A resposta deve ser ESTRITAMENTE em formato JSON, sem marcação markdown (sem \`\`\`json).

Estrutura JSON esperada:
{
  "text": "A mensagem curta de no máximo 20 palavras",
  "reference": "Referência bíblica (apenas para promessa e devocional)",
  "author": "Nome do autor (apenas para pregacao)"
}`;

const SYSTEM_PROMPT_REEL = `Você é um roteirista de vídeos virais curtos (Reels) para uma página cristã.
Crie um roteiro narrado (apenas as palavras faladas) de 30 a 50 palavras no máximo (cerca de 20 segundos de fala).
Estrutura obrigatória:
1. Um GANCHO forte nas primeiras 5 palavras.
2. Uma reflexão ou mensagem profunda e confortadora.
3. Um CTA (chamada para ação) curto no final (ex: "Siga a página", "Deixe um Amém").
NÃO adicione instruções de cena, NUNCA use aspas, apenas o texto que será lido pela voz.
A resposta deve ser ESTRITAMENTE em formato JSON, sem marcação markdown.

Estrutura JSON esperada:
{
  "text": "O texto narrado do roteiro completo",
  "background_keyword": "Uma palavra em inglês para buscar um vídeo de fundo (ex: nature, rain, sunset, clouds, aesthetic)"
}`;

export async function generateContent(type: 'promessa' | 'devocional' | 'data' | 'motivacional' | 'pregacao', mediaType: 'IMAGE' | 'REEL' = 'IMAGE') {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      systemInstruction: mediaType === 'REEL' ? SYSTEM_PROMPT_REEL : SYSTEM_PROMPT_IMAGE
    });

    const result = await model.generateContent(`Gere um conteúdo do tipo: ${type}`);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}
