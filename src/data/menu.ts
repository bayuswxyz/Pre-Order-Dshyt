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

export const ORDER_SCRIPT_URL =
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
    price: 10000,
    imageUrl: '/assets/aistudio/Dshyt_Aemericano_Original_d32980eb.jpg',
    fallbackKey: 'espresso',
    category: 'Espresso & Black',
    note: 'Espresso double shot dengan air mineral dingin, bersih dan bertenaga.',
  },
  {
    id: 'americano-lemon',
    name: 'Americano Lemon',
    cartKey: 'Americano Lemon',
    price: 10000,
    imageUrl: '/assets/aistudio/Dshyt_Americano_Lemon_86ac4d3e.jpg',
    fallbackKey: 'citrus',
    category: 'Citrus & Sparkling',
    note: 'Americano segar berpadu perasan lemon cerah untuk fokus seharian.',
  },
  {
    id: 'orange-blanc-coffee',
    name: 'Orange Blanc Coffee',
    cartKey: 'Orange Blanc Coffee',
    price: 16000,
    imageUrl: '/assets/aistudio/DSHYT_Orange_Blanc_Coffee_5fcbfecb.jpg',
    fallbackKey: 'orangeCoffee',
    category: 'Citrus & Sparkling',
    note: 'Perpaduan jus jeruk manis, krim lembut, dan shot espresso aromatik.',
  },
  {
    id: 'blanc-dshyt',
    name: "Blanc D'SHYT",
    cartKey: 'Blanc DSHYT',
    price: 15000,
    imageUrl: '/assets/aistudio/DSHYT_blanc_f2e00078.jpg',
    fallbackKey: 'milkCoffee',
    category: 'Signature & Susu',
    note: 'Racikan susu putih creamy andalan dengan karakter manis seimbang.',
  },
  {
    id: 'chocolate-vanilla',
    name: 'Chocolate Vanilla',
    cartKey: 'Chocolate Vanilla',
    price: 14000,
    imageUrl: '/assets/aistudio/Dshyt_Chocolate_vanilla_ebab28ca.jpg',
    fallbackKey: 'chocVanilla',
    category: 'Signature & Susu',
    note: 'Cokelat pekat non-kopi berpadu aroma vanila halus dan susu segar.',
  },
  {
    id: 'coffee-vanilla-milk',
    name: 'Coffee Vanilla Milk',
    cartKey: 'Coffee Vanilla Milk',
    price: 14000,
    imageUrl: '/assets/aistudio/DSHYT_Coffee_vanila_milk_4a08c3bf.jpg',
    fallbackKey: 'milkCoffee',
    category: 'Signature & Susu',
    note: 'Kopi susu dingin dengan sentuhan sirup vanila lembut yang nyaman.',
  },
  {
    id: 'mochachino',
    name: 'Mochachino',
    cartKey: 'Mochachino',
    price: 14000,
    imageUrl: '/assets/aistudio/DSHYT_Mochachino_ba008fa3.jpg',
    fallbackKey: 'chocVanilla',
    category: 'Signature & Susu',
    note: 'Keseimbangan klasik antara cokelat kaya rasa, susu, dan espresso.',
  },
  {
    id: 'orange-blanc',
    name: 'Orange Blanc',
    cartKey: 'Orange Blanc',
    price: 15000,
    imageUrl: '/assets/aistudio/DSHYT_Orange_Blanc_dd046048.jpg',
    fallbackKey: 'orangeCoffee',
    category: 'Citrus & Sparkling',
    note: 'Minuman jeruk creamy tanpa kopi yang ringan dan menyegarkan.',
  },
  {
    id: 'orange-sparkling',
    name: 'Orange Sparkling',
    cartKey: 'Orange Sparkling',
    price: 13000,
    imageUrl: '/assets/aistudio/DSHYT_Orange_Sparkling_673d5cd2.jpg',
    fallbackKey: 'citrus',
    category: 'Citrus & Sparkling',
    note: 'Soda jeruk dingin dengan buih segar untuk mengusir kantuk siang.',
  },
  {
    id: 'coffee-milk-dshyt',
    name: "Coffee Milk D'SHYT",
    cartKey: 'Coffee Milk DSHYT',
    price: 13000,
    imageUrl: '/assets/aistudio/DSHYT_Coffee_Milk_3ce00d3b.jpg',
    fallbackKey: 'milkCoffee',
    category: 'Signature & Susu',
    note: 'Kopi susu signature harian dengan rasa manis pas dan body mantap.',
  },
];
