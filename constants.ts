import { CardOption } from './types';

export const TARGET_OPTIONS: CardOption[] = [
  { id: 'mens', label: 'Men', description: 'Contemporary menswear.', image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=500&q=80' },
  { id: 'womens', label: 'Women', description: 'Modern womenswear.', image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&q=80' },
  { id: 'unisex', label: 'Unisex', description: 'Gender-neutral basics.', image: 'https://images.unsplash.com/photo-1504194921103-f8b80cadd5e4?w=500&q=80' },
];

export const CATEGORY_OPTIONS: CardOption[] = [
  { id: 'tops', label: 'Tops', description: 'Shirts, Knits, Hoodies.', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80' },
  { id: 'outerwear', label: 'Outerwear', description: 'Coats, Jackets, Blazers.', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80' },
  { id: 'bottoms', label: 'Bottoms', description: 'Pants, Skirts, Denim.', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&q=80' },
  { id: 'shoes', label: 'Shoes', description: 'Sneakers, Boots, Loafers.', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80' },
];

export const SUB_CATEGORY_OPTIONS: Record<string, CardOption[]> = {
  tops: [
    { id: 'tshirt', label: 'T-Shirt', description: 'Essential basic.', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80' },
    { id: 'knitwear', label: 'Knitwear', description: 'Sweaters & Cardigans.', image: 'https://images.unsplash.com/photo-1624835656627-cce6b4b45564?w=500&q=80' },
    { id: 'shirt', label: 'Button-Up', description: 'Smart casual to formal.', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80' },
  ],
  outerwear: [
    { id: 'coat', label: 'Coat', description: 'Trench, Wool, Overcoat.', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500&q=80' },
    { id: 'jacket', label: 'Jacket', description: 'Denim, Bomber, Leather.', image: 'https://images.unsplash.com/photo-1551028919-ac66e6a39d44?w=500&q=80' },
    { id: 'blazer', label: 'Blazer', description: 'Tailored look.', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&q=80' },
  ],
  bottoms: [
    { id: 'denim', label: 'Denim', description: 'Jeans & casual.', image: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=500&q=80' },
    { id: 'trousers', label: 'Trousers', description: 'Slacks, Chinos.', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80' },
    { id: 'skirt', label: 'Skirt', description: 'Midi, Maxi, Mini.', image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&q=80' },
  ],
  shoes: [
    { id: 'sneaker', label: 'Sneakers', description: 'Sporty & casual.', image: 'https://images.unsplash.com/photo-1560769629-975e13f0c470?w=500&q=80' },
    { id: 'boots', label: 'Boots', description: 'Chelsea, Combat, Ankle.', image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500&q=80' },
    { id: 'loafer', label: 'Loafers', description: 'Slip-on classic.', image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=500&q=80' },
  ],
};

export const STYLE_PRESETS: CardOption[] = [
  { id: 'minimal', label: 'Minimal', description: 'Clean, simple, essential. Like Uniqlo U.', image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&q=80' },
  { id: 'street', label: 'Street', description: 'Bold, oversized, trendy.', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=500&q=80' },
  { id: 'classic', label: 'Classic', description: 'Timeless, tailored, smart.', image: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=500&q=80' },
  { id: 'casual', label: 'Casual', description: 'Relaxed, everyday comfort.', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80' },
];

export const MOOD_OPTIONS: CardOption[] = [
  { id: 'city', label: 'City Life', description: 'Urban, sleek, day-to-night.', image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=500&q=80' },
  { id: 'vacation', label: 'Vacation', description: 'Resort, airy, relaxed.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80' },
  { id: 'office', label: 'Office', description: 'Professional, sharp.', image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=500&q=80' },
  { id: 'cozy', label: 'Weekend', description: 'Soft, warm, homey.', image: 'https://images.unsplash.com/photo-1512918760532-3c50f4a2b04e?w=500&q=80' },
];