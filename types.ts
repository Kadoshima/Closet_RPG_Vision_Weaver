
export enum FlowStep {
  TARGET_SELECT = 'TARGET_SELECT',
  CATEGORY_SELECT = 'CATEGORY_SELECT',
  SUB_CATEGORY_SELECT = 'SUB_CATEGORY_SELECT',
  STYLE_PRESET = 'STYLE_PRESET',
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
  subCategory?: CardOption;
  stylePreset?: CardOption;
  mood?: CardOption;
}

export interface ProductSpecs {
  comfort: number;     // 快適さ
  versatility: number; // 着回し力
  trend: number;       // トレンド感
  warmth: number;      // 機能性/暖かさ (context dependent, but good general metric)
  price_tier: number;  // 1-100 implying affordability to luxury
}

export interface ProductInfo {
  name: string;
  description: string;
  stylingTips: string;
  materials: string; // Cotton, Wool, etc.
}

export interface GeneratedItem {
  id: string;
  imageUrl: string;
  info: ProductInfo;
  specs: ProductSpecs;
  matchScore?: number; // Closet compatibility
}

export interface ClosetItem {
  id: string;
  imageUrl: string;
  analysis: {
    color: string;
    style: string;
    season: string;
    material: string;
  };
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
