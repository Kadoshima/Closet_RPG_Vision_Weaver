import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedLook, ProductSpecs, ProductInfo, SearchResult, BespokeQuote, ClosetAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateFashionImage = async (
  prompt: string
): Promise<string> => {
  try {
    // Generate a high-fashion editorial style image
    // Updated prompt to force model presence and focus on clothing
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `High-quality fashion photography. A professional model posing wearing: ${prompt}. The image MUST depict a person wearing the described clothing. Focus on the apparel design, fabric textures, and styling. Cinematic lighting, 8k resolution, photorealistic, vogue magazine style.` }],
      },
      config: {
        imageConfig: {
            aspectRatio: "3:4", // Portrait for fashion looks
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
    console.error("Image generation failed:", error);
    // Fallback if image generation completely fails
    return "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=500&q=80";
  }
};

export const generateLookDetails = async (
  styleDescription: string
): Promise<{ specs: ProductSpecs; info: ProductInfo }> => {
  try {
    const prompt = `
      You are a Creative Director for a luxury fashion brand.
      Create a product profile for this design concept: "${styleDescription}".
      
      Return JSON with:
      - specs: comfort, versatility, trend, warmth, price_tier (all 0-100 integers)
      - info: 
          name (A sophisticated, short name. e.g. "The Midnight Wool Coat"), 
          description (Evocative description of the design, fabric, and mood. Max 2 sentences.), 
          stylingTips (Specific advice on how to style this item.), 
          materials (Premium material composition, e.g. "Italian Merino Wool, Silk Lining")
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            specs: {
              type: Type.OBJECT,
              properties: {
                comfort: { type: Type.INTEGER },
                versatility: { type: Type.INTEGER },
                trend: { type: Type.INTEGER },
                warmth: { type: Type.INTEGER },
                price_tier: { type: Type.INTEGER },
              }
            },
            info: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                stylingTips: { type: Type.STRING },
                materials: { type: Type.STRING },
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Detail generation failed:", error);
    return {
      specs: { comfort: 80, versatility: 80, trend: 80, warmth: 50, price_tier: 50 },
      info: { name: "Signature Look", description: "A timeless design.", stylingTips: "Wear with confidence.", materials: "Premium Blend" }
    };
  }
};

export const generateFromVoice = async (audioBase64: string, currentContext: string): Promise<{ modification: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
          { text: `The user is providing feedback on this fashion design: "${currentContext}". Interpret the audio. Return a concise visual description of how the design should change (e.g. "Change the color to midnight blue", "Add a belt").` }
        ]
      }
    });
    return { modification: response.text || "No change detected" };
  } catch (e) {
    console.error(e);
    return { modification: "Error processing voice" };
  }
}

export const searchItemByImage = async (base64Image: string): Promise<SearchResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Identify the main fashion item in this image. Find where to buy similar items online. Return links." }
        ]
      },
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const description = response.text || "No description found.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links: { title: string; uri: string }[] = [];

    chunks.forEach(chunk => {
      if (chunk.web) {
        links.push({
          title: chunk.web.title || "Web Result",
          uri: chunk.web.uri || "#"
        });
      }
    });

    const uniqueLinks = links.filter((link, index, self) => 
      index === self.findIndex((l) => l.uri === link.uri)
    );

    return { description, links: uniqueLinks };
  } catch (error) {
    console.error("Visual search failed:", error);
    return { 
      description: "Could not perform visual search.", 
      links: [] 
    };
  }
};

export const estimateBespokeCost = async (base64Image: string): Promise<BespokeQuote> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { 
              text: `You are a master tailor. Analyze this garment. Estimate the cost to create a bespoke version.
              
              Return JSON with:
              - fabricName: string
              - fabricCost: number
              - laborHours: number
              - laborCost: number
              - totalCost: number
              - timeline: string
              - complexity: "Low" | "Medium" | "High" | "Masterpiece"
              - comments: string`
            }
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
      return {
        fabricName: "Standard Fabric",
        fabricCost: 100,
        laborHours: 20,
        laborCost: 1000,
        totalCost: 1300,
        timeline: "4 weeks",
        complexity: "Medium",
        comments: "Estimation failed, using standard values."
      };
    }
}

export const analyzeClosetImage = async (base64Image: string): Promise<ClosetAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Analyze this clothing item. Identify style, color, material, and season." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                style: { type: Type.STRING },
                color: { type: Type.STRING },
                material: { type: Type.STRING },
                season: { type: Type.STRING },
            }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error("No text response");
  } catch (error) {
    console.error("Closet analysis failed:", error);
    return {
      style: "Casual",
      color: "Multi-color",
      material: "Unknown",
      season: "Any"
    };
  }
};