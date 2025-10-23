import { GoogleGenAI, Type, Chat } from "@google/genai";
import { DiagnosisResult, PlantIdentificationResult, ImageInput, Language, MarketPriceResult } from '../types';
import { translations } from "../translations";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';

const diagnosisSchema = {
    type: Type.OBJECT,
    properties: {
        diseaseName: { type: Type.STRING, description: "Name of the plant disease." },
        confidence: { type: Type.STRING, description: "Confidence level of the diagnosis (e.g., High, Medium, Low)." },
        description: { type: Type.STRING, description: "A brief description of the disease." },
        organicTreatments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of organic treatment methods." },
        chemicalTreatments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of chemical treatment methods." },
        preventionTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of tips to prevent the disease." }
    },
    required: ['diseaseName', 'confidence', 'description', 'organicTreatments', 'chemicalTreatments', 'preventionTips']
};

export const diagnosePlant = async (prompt: string, language: Language, image?: ImageInput): Promise<DiagnosisResult> => {
    const fullPrompt = `${prompt} Respond in the language with locale code: ${language}.`;

    const parts: any[] = [{ text: fullPrompt }];
    if (image) {
        parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    }

    const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: { responseMimeType: "application/json", responseSchema: diagnosisSchema }
    });

    try {
        return JSON.parse(response.text.trim()) as DiagnosisResult;
    } catch (e) {
        console.error("Failed to parse diagnosis response:", response.text);
        throw new Error("The model returned an invalid response.");
    }
};

const identificationSchema = {
    type: Type.OBJECT,
    properties: {
        commonName: { type: Type.STRING, description: "Common name of the plant." },
        scientificName: { type: Type.STRING, description: "Scientific name of the plant." },
        description: { type: Type.STRING, description: "A brief description of the plant." },
        careTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of care tips for the plant." },
    },
    required: ['commonName', 'scientificName', 'description', 'careTips']
};

export const identifyPlant = async (prompt: string, language: Language, image: ImageInput): Promise<PlantIdentificationResult> => {
    const fullPrompt = `${prompt} Respond in the language with locale code: ${language}.`;
    const contents = { parts: [{ text: fullPrompt }, { inlineData: { mimeType: image.mimeType, data: image.data } }] };

    const response = await ai.models.generateContent({
        model,
        contents,
        config: { responseMimeType: "application/json", responseSchema: identificationSchema }
    });
    
    try {
        return JSON.parse(response.text.trim()) as PlantIdentificationResult;
    } catch (e) {
        console.error("Failed to parse identification response:", response.text);
        throw new Error("The model returned an invalid response.");
    }
};

export const getCropInformation = async (cropName: string, language: Language): Promise<string> => {
    const prompt = `Provide detailed information about growing ${cropName}, including soil preparation, planting, watering, fertilizing, and harvesting. Respond in the language with locale code: ${language}. Format the response in markdown.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const createChatInstance = (language: Language): Chat => {
    const systemInstruction = translations[language].expertChatSystemPrompt;
    return ai.chats.create({ model, config: { systemInstruction } });
};

export const getMarketPrices = async (cropName: string, language: Language): Promise<{ text: string, sources: any[] }> => {
    const prompt = `What are the latest market prices for "${cropName}" in various markets, particularly in India? Provide a summary and then a markdown table with columns for "Market Name", "Price", and "Date". Respond in the language with locale code: ${language}.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    return { text: response.text, sources };
};

export const getCommunityAnswer = async (question: string, language: Language): Promise<string> => {
    const prompt = `A farmer has a question: "${question}". As an AI agricultural expert, provide a helpful and encouraging answer. Respond in the language with locale code: ${language}.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};
