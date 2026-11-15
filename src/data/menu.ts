export type MenuCategory = 'Semua' | 'Signature & Susu' | 'Espresso & Black' | 'Citrus & Sparkling';

export type FallbackImageKey =
  | 'espresso'
  | 'orangeCoffee'
  | 'milkCoffee'
  | 'chocVanilla'
  | 'citrus';

export interface MenuItem {
  id: string;
  name: string;
  /** Exact key submitted to Google Apps Script (matches original form script keys). */
  cartKey: string;
  price: number;
  imageUrl: string;
  fallbackKey: FallbackImageKey;
  category: Exclude<MenuCategory, 'Semua'>;
  note: string;
}

const envOrderScriptUrl =
  typeof import.meta !== 'undefined'
    ? (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_ORDER_SCRIPT_URL
    : undefined;

export const ORDER_SCRIPT_URL =
  envOrderScriptUrl?.trim() ||
  'https://script.google.com/macros/s/AKfycbzQZA2XcpyosyDhVSVntL7eFiDcvXiZ2LkcV7S0os6CdKGbBViGPzTZqS3muodp37xG/exec';

export const MENU_CATEGORIES: MenuCategory[] = [
  'Semua',
  'Signature & Susu',
  'Espresso & Black',
  'Citrus & Sparkling',
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'espresso-pouch',
    name: 'Espresso Pouch',
    cartKey: 'Espresso Pouch',
    price: 10000,
    imageUrl: '/assets/aistudio/DSHYT_Espresso_Pouch__d2a07a57.png',
    fallbackKey: 'espresso',
    category: 'Espresso & Black',
    note: 'Ekstraksi espresso pekat dalam kemasan pouch praktis siap seduh.',
  },
  {
    id: 'americano-original',
    name: 'Americano Original',
    cartKey: 'Americano Original',
    price: 12000,
    imageUrl: '/assets/aistudio/Americano_Original_Dshyt.jpg',
    fallbackKey: 'espresso',
    category: 'Espresso & Black',
    note: 'Espresso double shot dengan air mineral dingin, bersih dan bertenaga.',
  },
  {
    id: 'americano-lemon',
    name: 'Americano Lemon',
    cartKey: 'Americano Lemon',
    price: 13000,
    imageUrl: '/assets/aistudio/Americano_Lemon_Dshyt.jpg',
    fallbackKey: 'citrus',
    category: 'Citrus & Sparkling',
    note: 'Americano segar berpadu perasan lemon cerah untuk fokus seharian.',
  },
  {
    id: 'orange-blanc-dshyt',
    name: "Orange Blanc D'SHYT",
    cartKey: 'Orange Blanc Dshyt',
    price: 12000,
    imageUrl: '/assets/aistudio/Orange_Blanc_Dshyt.jpg',
    fallbackKey: 'citrus',
    category: 'Citrus & Sparkling',
    note: 'Perpaduan orange blanc segar dengan creamy blend non-kopi yang lembut dan manis.',
  },
  {
    id: 'anti-blanc-dshyt',
    name: "Anti Blanc D'SHYT",
    cartKey: 'Anti Blanc Dshyt',
    price: 18000,
    imageUrl: '/assets/aistudio/Anti_Blanc_Dshyt.jpg',
    fallbackKey: 'milkCoffee',
    category: 'Signature & Susu',
    note: 'Racikan susu putih creamy andalan dengan karakter manis seimbang.',
  },
  {
    id: 'chocolate-vanilla',
    name: 'Chocolate Vanilla',
    cartKey: 'Chocolate Vanilla',
    price: 10000,
    imageUrl: '/assets/aistudio/Chocolate_Vanilla.jpg',
    fallbackKey: 'chocVanilla',
    category: 'Signature & Susu',
    note: 'Cokelat pekat non-kopi berpadu aroma vanila halus dan susu segar.',
  },
  {
    id: 'coffee-vanilla-milk',
    name: 'Coffee Vanilla Milk',
    cartKey: 'Coffee Vanilla Milk',
    price: 15000,
    imageUrl: '/assets/aistudio/Coffee_Vanilla_Milk.jpg',
    fallbackKey: 'milkCoffee',
    category: 'Signature & Susu',
    note: 'Kopi susu dingin dengan sentuhan sirup vanila lembut yang nyaman.',
  },
  {
    id: 'mochachino',
    name: 'Mochachino',
    cartKey: 'Mochachino',
    price: 18000,
    imageUrl: '/assets/aistudio/Mochachino_Dshyt.jpg',
    fallbackKey: 'chocVanilla',
    category: 'Signature & Susu',
    note: 'Keseimbangan klasik antara cokelat kaya rasa, susu, dan espresso.',
  },
  {
    id: 'orange-anti-blanc-dshyt',
    name: "Orange Anti Blanc D'SHYT",
    cartKey: 'Orange Anti Blanc Dshyt',
    price: 15000,
    imageUrl: '/assets/aistudio/Orange_Anti_Blanc_Dshyt.jpg',
    fallbackKey: 'orangeCoffee',
    category: 'Citrus & Sparkling',
    note: 'Perpaduan orange blanc segar dengan espresso dan creamy blend yang unik.',
  },
  {
    id: 'orange-sparkling',
    name: 'Orange Sparkling',
    cartKey: 'Orange Sparkling',
    price: 10000,
    imageUrl: '/assets/aistudio/Orange_Sparkling.jpg',
    fallbackKey: 'citrus',
    category: 'Citrus & Sparkling',
    note: 'Soda jeruk dingin dengan buih segar untuk mengusir kantuk siang.',
  },
  {
    id: 'coffee-milk-dshyt',
    name: "Coffee Milk D'SHYT",
    cartKey: 'Coffee Milk DSHYT',
    price: 13000,
    imageUrl: '/assets/aistudio/Coffee_Milk_Dshyt.jpg',
    fallbackKey: 'milkCoffee',
    category: 'Signature & Susu',
    note: 'Kopi susu signature harian dengan rasa manis pas dan body mantap.',
  },
];
