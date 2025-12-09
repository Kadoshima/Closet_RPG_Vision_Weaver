import { CardOption } from './types';

export const GENDER_OPTIONS: CardOption[] = [
  { id: 'mens', label: 'Men\'s', description: 'Equipment for the masculine frame.', image: 'https://picsum.photos/200/200?random=1' },
  { id: 'womens', label: 'Women\'s', description: 'Equipment for the feminine frame.', image: 'https://picsum.photos/200/200?random=2' },
  { id: 'unisex', label: 'Unisex', description: 'Universal equipment.', image: 'https://picsum.photos/200/200?random=3' },
];

export const CATEGORY_OPTIONS: CardOption[] = [
  { id: 'bags', label: 'Bag', description: 'Inventory management.', image: 'https://picsum.photos/200/200?random=4' },
  { id: 'shoes', label: 'Footwear', description: 'Mobility enhancement.', image: 'https://picsum.photos/200/200?random=5' },
  { id: 'outerwear', label: 'Outerwear', description: 'Environmental protection.', image: 'https://picsum.photos/200/200?random=6' },
  { id: 'tops', label: 'Tops', description: 'Torso armor.', image: 'https://picsum.photos/200/200?random=7' },
];

export const SUB_CATEGORY_OPTIONS: Record<string, CardOption[]> = {
  bags: [
    { id: 'backpack', label: 'Backpack', description: 'High capacity, hands-free.', image: 'https://picsum.photos/200/200?random=8' },
    { id: 'tote', label: 'Tote', description: 'Quick access, casual vibe.', image: 'https://picsum.photos/200/200?random=9' },
    { id: 'messenger', label: 'Messenger', description: 'Urban mobility, secure.', image: 'https://picsum.photos/200/200?random=10' },
  ],
  shoes: [
    { id: 'sneaker', label: 'Sneakers', description: 'Agility +5.', image: 'https://picsum.photos/200/200?random=11' },
    { id: 'boots', label: 'Boots', description: 'Durability +10.', image: 'https://picsum.photos/200/200?random=12' },
  ],
  outerwear: [
    { id: 'coat', label: 'Coat', description: 'Formal defense.', image: 'https://picsum.photos/200/200?random=13' },
    { id: 'jacket', label: 'Jacket', description: 'Lightweight defense.', image: 'https://picsum.photos/200/200?random=14' },
  ],
  tops: [
    { id: 'shirt', label: 'Shirt', description: 'Basic layer.', image: 'https://picsum.photos/200/200?random=15' },
    { id: 'knit', label: 'Knit', description: 'Warmth layer.', image: 'https://picsum.photos/200/200?random=16' },
  ]
};

export const STYLE_PRESETS: CardOption[] = [
  { id: 'minimal', label: 'Minimalist', description: 'Clean lines. Stealth +5.', image: 'https://picsum.photos/200/200?random=17' },
  { id: 'rugged', label: 'Rugged', description: 'Weathered look. Toughness +10.', image: 'https://picsum.photos/200/200?random=18' },
  { id: 'luxury', label: 'Luxury', description: 'High status. Charisma +20.', image: 'https://picsum.photos/200/200?random=19' },
  { id: 'tech', label: 'Techwear', description: 'Functional. Utility +15.', image: 'https://picsum.photos/200/200?random=20' },
  { id: 'vintage', label: 'Vintage', description: 'Classic appeal. Lore +10.', image: 'https://picsum.photos/200/200?random=21' },
];

export const MOOD_OPTIONS: CardOption[] = [
  { id: 'noir', label: 'Noir', description: 'Dark, mysterious, leather.', image: 'https://picsum.photos/200/200?random=22' },
  { id: 'earth', label: 'Earth', description: 'Natural tones, organic.', image: 'https://picsum.photos/200/200?random=23' },
  { id: 'neon', label: 'Cyber', description: 'High contrast, synthetic.', image: 'https://picsum.photos/200/200?random=24' },
  { id: 'pastel', label: 'Ethereal', description: 'Soft, light, airy.', image: 'https://picsum.photos/200/200?random=25' },
];
