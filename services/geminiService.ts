import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedItem, ProductSpecs, ProductInfo, ClosetItem, SearchResult, BespokeQuote } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateProductDetails = async (
  features: string,
  closetContext?: string
): Promise<{ specs: ProductSpecs; info: ProductInfo; matchScore?: number }> => {
  try {
    const prompt = `
      You are a Senior Fashion Designer and Stylist for a modern apparel brand like Uniqlo, H&M, or COS.
      Design a product with these features: "${features}".
      ${closetContext ? `Also analyze stylistic compatibility with this item from the user's wardrobe: ${closetContext}. Give a score 0-100.` : ''}
      
      Return JSON with:
      - specs: comfort, versatility, trend, warmth, price_tier (all 0-100 integers)
      - info: 
          name (Catchy, modern product name like "Cotton Oversized Tee"), 
          description (Professional e-commerce description, max 2 sentences), 
          stylingTips (How to wear it, e.g., "Pair with wide-fit jeans."), 
          materials (e.g., "100% Organic Cotton")
      ${closetContext ? '- matchScore: 0-100' : ''}
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
            },
            matchScore: { type: Type.INTEGER }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Lore generation failed:", error);
    return {
      specs: { comfort: 80, versatility: 80, trend: 50, warmth: 50, price_tier: 50 },
      info: { name: "Classic Staple", description: "A timeless piece for any wardrobe.", stylingTips: "Versatile enough for any occasion.", materials: "Cotton Blend" },
      matchScore: 50
    };
  }
};

export const generateItemImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  try {
    // Generate clean e-commerce style image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Professional studio fashion photography of: ${prompt}. Clean white background, soft studio lighting, catalogue style, H&M or Uniqlo aesthetic. High resolution.` }],
      },
      config: {
        imageConfig: {
            aspectRatio: aspectRatio as any, 
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
    return `https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80`;
  }
};

export const analyzeClosetImage = async (base64Image: string): Promise<ClosetItem['analysis']> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Analyze this clothing item for a fashion app. Return JSON with 'color', 'style' (e.g. casual, formal), 'season', and 'material'." }
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
          { text: `The user is describing how to modify this fashion design: "${currentContext}". Interpret the feedback (including abstract words like 'softer', 'bolder'). Return a short text description of the design change needed.` }
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
          { text: "Identify this fashion item in detail (brand, style, material). Find similar items for sale online. Return a helpful description for a shopper." }
        ]
      },
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const description = response.text || "No description found.";
    
    // Extract grounding chunks for links
    // The path is response.candidates[0].groundingMetadata.groundingChunks
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

    // Remove duplicates
    const uniqueLinks = links.filter((link, index, self) => 
      index === self.findIndex((l) => l.uri === link.uri)
    );

    return { description, links: uniqueLinks };
  } catch (error) {
    console.error("Visual search failed:", error);
    return { 
      description: "Could not perform visual search at this time.", 
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
            text: `You are a master tailor for high-end bespoke fashion. Analyze this garment image to create a manufacturing cost estimate for a single custom-made piece.
            
            Deconstruct the item into:
            1. Fabric: Identify likely fabric (e.g., Italian Wool, Silk) and estimate yardage required. Estimate cost per yard (premium quality).
            2. Labor: Estimate hours for pattern making, cutting, and sewing by a skilled tailor.
            3. Complexity: Assess construction difficulty.

            Return JSON with:
            - fabricName: string
            - fabricCost: number (Total fabric cost in USD)
            - laborHours: number
            - laborCost: number (Total labor cost in USD, assume $50/hr)
            - totalCost: number (Sum + 20% margin)
            - timeline: string (e.g., "4-6 weeks")
            - complexity: "Low" | "Medium" | "High" | "Masterpiece"
            - comments: string (Brief expert assessment of construction)`
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
    // Fallback estimate
    return {
      fabricName: "Standard Fabric",
      fabricCost: 50,
      laborHours: 10,
      laborCost: 500,
      totalCost: 650,
      timeline: "4 weeks",
      complexity: "Medium",
      comments: "Estimation failed, using standard values."
    };
  }
}