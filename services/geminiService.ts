import { GoogleGenAI } from "@google/genai";

// Use standard process.env.API_KEY as per guidelines
const apiKey = process.env.API_KEY;

// Initialize conditionally to prevent crashes if key is missing during build
let ai: GoogleGenAI | null = null;
if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

export const askHRAssistant = async (
  query: string,
  userContext: string
): Promise<string> => {
  if (!ai) return "Error: API Key de Google no configurada.";

  try {
    const model = 'gemini-2.5-flash';
    const systemInstruction = `
      Eres un asistente experto de RRHH para la empresa 'HR Nexus'.
      Tu tono es profesional, empático y útil.
      
      Contexto del usuario actual:
      ${userContext}
      
      Tus funciones:
      1. Explicar políticas (inventa políticas estándar si no se especifican).
      2. Ayudar a redactar justificaciones para ausencias o rechazos.
      3. Analizar datos básicos si se te proporcionan.
      
      Responde de forma concisa. Si te preguntan sobre datos que no tienes, indícalo amablemente.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 } // Low latency
      }
    });

    return response.text || "Lo siento, no pude procesar tu solicitud en este momento.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Ocurrió un error al conectar con el asistente de IA.";
  }
};