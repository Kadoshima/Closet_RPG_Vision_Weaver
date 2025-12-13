
export enum FlowStep {
  TARGET_SELECT = 'TARGET_SELECT',
  CATEGORY_SELECT = 'CATEGORY_SELECT',
  STYLE_SELECT = 'STYLE_SELECT',
  MOOD_SELECT = 'MOOD_SELECT',
  GENERATION = 'GENERATION',
  DETAIL = 'DETAIL',
}

export interface CardOption {
  id: string;
  label: string;
  image?: string;
  description?: string;
}

export interface SelectionState {
  target?: CardOption;
  category?: CardOption;
  stylePreset?: CardOption;
  mood?: CardOption;
}

export interface ProductSpecs {
  comfort: number;
  versatility: number;
  trend: number;
  warmth: number;
  price_tier: number;
}

export interface ProductInfo {
  name: string;
  description: string;
  stylingTips: string;
  materials: string;
}

export interface GeneratedLook {
  id: string;
  imageUrl: string;
  info: ProductInfo;
  specs: ProductSpecs;
}

export interface SearchResult {
  description: string;
  links: {
    title: string;
    uri: string;
  }[];
}

export interface BespokeQuote {
  fabricName: string;
  fabricCost: number;
  laborHours: number;
  laborCost: number;
  totalCost: number;
  timeline: string;
  complexity: 'Low' | 'Medium' | 'High' | 'Masterpiece';
  comments: string;
}

export type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error';

export interface ClosetAnalysis {
  style: string;
  color: string;
  material: string;
  season: string;
}

export interface ClosetItem {
  id: string;
  imageUrl: string;
  analysis: ClosetAnalysis;
}