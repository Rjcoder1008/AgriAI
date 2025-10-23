export type Language = 'en-US' | 'es-ES' | 'hi-IN' | 'kn-IN';

export interface ImageInput {
  mimeType: string;
  data: string;
}

export interface DiagnosisResult {
  diseaseName: string;
  confidence: string;
  description:string;
  organicTreatments: string[];
  chemicalTreatments: string[];
  preventionTips: string[];
}

export interface PlantIdentificationResult {
  commonName: string;
  scientificName: string;
  description: string;
  careTips: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface MarketPriceResult {
  cropName: string;
  marketName: string;
  price: string;
  date: string;
  source?: {
    uri: string;
    title: string;
  }
}

export interface CommunityPost {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}
