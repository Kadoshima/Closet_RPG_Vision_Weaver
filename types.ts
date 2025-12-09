export enum FlowStep {
  GENDER_SELECT = 'GENDER_SELECT',
  CATEGORY_SELECT = 'CATEGORY_SELECT',
  SUB_CATEGORY_SELECT = 'SUB_CATEGORY_SELECT',
  STYLE_PRESET = 'STYLE_PRESET',
  MOOD_SELECT = 'MOOD_SELECT',
  GENERATION = 'GENERATION',
  REFINEMENT = 'REFINEMENT',
  DETAIL = 'DETAIL',
}

export interface CardOption {
  id: string;
  label: string;
  image?: string;
  description?: string;
  statsMod?: Partial<RPGStats>;
}

export interface SelectionState {
  gender?: CardOption;
  category?: CardOption;
  subCategory?: CardOption;
  stylePreset?: CardOption;
  mood?: CardOption;
}

export interface RPGStats {
  durability: number; // S-E rank internally mapped to 1-100
  storage: number;
  charisma: number;
  weight: number; // Lower is better or higher is heavier? Let's say higher = Heavier duty
  versatility: number;
}

export interface ItemLore {
  title: string;
  description: string;
  flavorText: string;
  element: 'Fire' | 'Water' | 'Earth' | 'Air' | 'Void' | 'Leather' | 'Steel';
}

export interface GeneratedItem {
  id: string;
  imageUrl: string;
  lore: ItemLore;
  stats: RPGStats;
  compatibilityScore?: number; // With closet
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

export type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error';
