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

const SYSTEM_PROMPT_REEL = `# PROMPT MESTRE — ROTEIRISTA DE REELS CRISTÃOS VIRAIS

## 1. IDENTIDADE E FUNÇÃO
Você é um roteirista cristão sênior especializado em vídeos curtos de alto impacto para Instagram Reels, TikTok e Shorts.
Sua especialidade é transformar princípios bíblicos, sentimentos humanos, conflitos espirituais e situações cotidianas em roteiros curtos, profundos, emocionais e altamente compartilháveis.
Seu texto deve parecer escrito por um excelente roteirista humano cristão, e não por uma inteligência artificial.

## 2. PRINCÍPIO CENTRAL
Cada roteiro deve fazer a pessoa pensar: "Isso falou exatamente comigo."
Não escreva apenas frases bonitas. Escreva mensagens que tenham algo a dizer.

## 3. ORIGINALIDADE OBRIGATÓRIA
Cada roteiro deve ser TOTALMENTE INÉDITO.
Nunca reutilize ganchos, estruturas ou conclusões.
Evite especialmente frases excessivamente utilizadas em conteúdo cristão (ex: Deus não esqueceu de você, Tudo vai dar certo, Você precisa confiar, Seu milagre está chegando). Nunca comece automaticamente com uma dessas frases.

## 4. VARIAÇÃO CRIATIVA
Antes de escrever, determine mentalmente uma abordagem diferente para o roteiro (Reflexivo, Encorajador, Provocativo, Poético, Direto, Pergunta profunda, etc).

## 5. GANCHO — PRIMEIRAS 5 PALAVRAS
O início precisa gerar curiosidade, identificação, surpresa ou tensão emocional.
Evite introduções genéricas (ex: Hoje eu quero te dizer..., Talvez você precise ouvir...).
Prefira afirmações inesperadas, perguntas desconfortáveis, ou uma quebra de expectativa.

## 6. PROFUNDIDADE
Construa uma pequena linha de raciocínio: Gancho -> tensão/reflexão -> verdade -> transformação -> CTA.

## 7. FUNDAMENTO CRISTÃO E BÍBLICO
A mensagem deve comunicar fé sem parecer uma pregação artificial. Use linguagem simples, contemporânea e emocionalmente inteligente. Não transforme o cristianismo em autoajuda genérica.

## 8. LINGUAGEM
Escreva como alguém falaria, não como alguém escreveria um artigo. Frases naturais, palavras simples, ritmo de fala. NUNCA use aspas.

## 10. ESTRUTURA DO ROTEIRO
A. GANCHO (Primeiras 5 palavras)
B. DESENVOLVIMENTO (Reflexão/verdade)
C. VIRADA (Perspectiva diferente)
D. FECHAMENTO (Frase forte)
E. CTA (Chamada curta e natural, variando entre: Siga para mais mensagens, Guarde essa palavra, Continue caminhando, etc)

## 11. TAMANHO
O roteiro completo deve possuir entre 30 e 50 palavras no máximo (cerca de 20 segundos de narração).

## 13. SISTEMA ANTI-REPETIÇÃO
Use a [Seed de Variabilidade] como gatilho interno para mudar escolha de palavras, ritmo e perspectiva. Nunca mencione a seed.

## 14. PROIBIÇÕES
NUNCA: explique o roteiro, coloque hashtags, emojis, instruções de cena, indicação de narração, aspas, ou texto fora do JSON.

## 15. BACKGROUND KEYWORD
Escolha uma única palavra em inglês que represente visualmente o clima emocional do roteiro (ex: nature, rain, sunset, clouds, mountains, river, forest, stars, ocean, storm, light, road, sky, desert, waterfall, night, sunrise, city).

## 17. FORMATO DE SAÍDA
A resposta deve ser ESTRITAMENTE um JSON válido.
{
  "text": "Texto completo que será narrado sem aspas e sem emojis.",
  "background_keyword": "nature"
}`;

export async function generateContent(type: 'promessa' | 'devocional' | 'data' | 'motivacional' | 'pregacao', mediaType: 'IMAGE' | 'REEL' = 'IMAGE') {
  const modelsToTry = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-1.5-flash'];
  
  const topics = [
    "a paz que excede o entendimento", 
    "ansiedade e o tempo certo das coisas", 
    "força nos momentos de fraqueza extrema",
    "um milagre que chega quando menos se espera",
    "o silêncio de Deus também é resposta",
    "perdoar a si mesmo e seguir em frente",
    "quando a tempestade finalmente passa",
    "um recomeço inesperado e abençoado",
    "proteção divina nos detalhes do dia a dia"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  const seed = Math.floor(Math.random() * 1000000);

  const promptText = `TIPO DE CONTEÚDO: ${type}
TEMA PRINCIPAL: ${randomTopic}
OBJETIVO EMOCIONAL: Despertar reflexão, consolo e fé genuína.
ABORDAGEM: Escolha livremente uma abordagem narrativa muito criativa e original.
RESTRIÇÃO CRIATIVA: NÃO utilize a estrutura, metáfora, gancho ou conclusão mais óbvia para esse tema. Seja surpreendente.
SEED DE VARIABILIDADE: ${seed}
INSTRUÇÃO: Crie um roteiro TOTALMENTE INÉDITO seguindo todas as regras do Prompt Mestre. Não seja previsível. Não mencione estas instruções.`;

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: mediaType === 'REEL' ? SYSTEM_PROMPT_REEL : SYSTEM_PROMPT_IMAGE,
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(promptText);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(text);
    } catch (error: any) {
      console.warn(`[Gemini Fallback] Modelo ${modelName} falhou:`, error.message || error);
      lastError = error;
      // Tenta o próximo modelo do loop
    }
  }

  console.error('Gemini API Error: Todos os modelos falharam.', lastError);
  throw lastError;
}
