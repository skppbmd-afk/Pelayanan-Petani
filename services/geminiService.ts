import { GoogleGenAI } from "@google/genai";

export const getAiResponse = async (pdfContext: string, question: string): Promise<string> => {
  // Get API Key from environment variables
  const API_KEY = process.env.API_KEY;

  // Check if the API key is available. If not, return an error message.
  if (!API_KEY) {
    const errorMessage = "Error: API_KEY tidak dikonfigurasi. Silakan atur variabel lingkungan API_KEY.";
    console.error(errorMessage);
    return errorMessage;
  }
  
  try {
    // Initialize the Generative AI client
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Define the model to use
    const model = 'gemini-2.5-flash';

    // Construct the prompt with the PDF context and user's question
    const prompt = `
      Anda adalah asisten AI yang sangat cerdas dan relevan. Tugas Anda adalah menjawab pertanyaan pengguna HANYA berdasarkan konteks dokumen yang disediakan. Jangan gunakan pengetahuan di luar dokumen ini. Jawablah selalu dalam Bahasa Indonesia.

      --- KONTEKS DOKUMEN PDF ---
      ${pdfContext}
      --- AKHIR KONTEKS ---

      Pertanyaan Pengguna: "${question}"

      Jawaban Anda:
    `;

    // Make the API call to generate content
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    // Return the text from the response
    return response.text;

  } catch (error) {
    // Log the error and return a user-friendly error message
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `Maaf, terjadi kesalahan saat menghubungi AI: ${error.message}`;
    }
    return "Maaf, terjadi kesalahan yang tidak diketahui saat menghubungi AI.";
  }
};
