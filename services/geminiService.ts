import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedItem, RPGStats, ItemLore, ClosetItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateLoreAndStats = async (
  features: string,
  closetContext?: string
): Promise<{ stats: RPGStats; lore: ItemLore; compatibility?: number }> => {
  try {
    const prompt = `
      You are an RPG Item Master for a fashion application.
      Create RPG statistics and lore for a fashion item with these features: "${features}".
      ${closetContext ? `Also analyze compatibility with this closet item: ${closetContext}. Give a score 0-100.` : ''}
      
      Return JSON with:
      - stats: durability, storage, charisma, weight, versatility (all 0-100)
      - lore: title (creative name), description (professional), flavorText (RPG style story), element (one of Fire, Water, Earth, Air, Void, Leather, Steel)
      ${closetContext ? '- compatibility: 0-100' : ''}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stats: {
              type: Type.OBJECT,
              properties: {
                durability: { type: Type.INTEGER },
                storage: { type: Type.INTEGER },
                charisma: { type: Type.INTEGER },
                weight: { type: Type.INTEGER },
                versatility: { type: Type.INTEGER },
              }
            },
            lore: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                flavorText: { type: Type.STRING },
                element: { type: Type.STRING },
              }
            },
            compatibility: { type: Type.INTEGER }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Lore generation failed:", error);
    // Fallback data
    return {
      stats: { durability: 50, storage: 50, charisma: 50, weight: 50, versatility: 50 },
      lore: { title: "Unknown Artifact", description: "An item shrouded in mystery.", flavorText: "The stats are unreadable...", element: "Void" },
      compatibility: 50
    };
  }
};

export const generateItemImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  try {
    // Switch to gemini-2.5-flash-image for better availability/permissions
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A high quality, photorealistic fashion product shot of: ${prompt}. Clean studio lighting, white background.` }],
      },
      config: {
        imageConfig: {
            aspectRatio: aspectRatio as any, 
            // imageSize is not supported in gemini-2.5-flash-image
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image generation failed", error);
    return `https://picsum.photos/seed/${Math.random()}/512/512`;
  }
};

export const analyzeClosetImage = async (base64Image: string): Promise<ClosetItem['analysis']> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Analyze this fashion item. Return JSON with 'color', 'style', 'season', and 'material'." }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });
    
    if (response.text) {
        return JSON.parse(response.text);
    }
    throw new Error("Analysis failed");

  } catch (e) {
    console.error(e);
    return { color: 'Unknown', style: 'Unknown', season: 'All', material: 'Unknown' };
  }
}

export const generateFromVoice = async (audioBase64: string, currentContext: string): Promise<{ modification: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Supports audio input
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
          { text: `The user is describing how to modify this fashion item: "${currentContext}". Interpret the onomatopoeia or description. Return a short text description of the visual change needed.` }
        ]
      }
    });
    return { modification: response.text || "No change detected" };
  } catch (e) {
    console.error(e);
    return { modification: "Error processing voice" };
  }
}
