import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || 'dummy_key';
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_PROMPT = `Você é um gerador de conteúdo cristão para o aplicativo "Diário do Céu".
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

export async function generateContent(type: 'promessa' | 'devocional' | 'data' | 'motivacional' | 'pregacao') {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT
    });

    const result = await model.generateContent(`Gere um conteúdo do tipo: ${type}`);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '');
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}
