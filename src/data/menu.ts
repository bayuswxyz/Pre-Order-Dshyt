export type MenuCategory = 'Semua' | 'Signature & Susu' | 'Espresso & Black' | 'Citrus & Sparkling';

export interface MenuItem {
  id: string;
  name: string;
  /** Exact key submitted to Google Apps Script (matches original form script keys). */
  cartKey: string;
  price: number;
  imageUrl: string;
  fallbackImageUrl: string;
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

const IMG_ESPRESSO = '/src/assets/images/drink_espresso_americano_1794658863394.jpg';
const IMG_ORANGE_COFFEE = '/src/assets/images/drink_orange_coffee_1794658863590.jpg';
const IMG_MILK_COFFEE = '/src/assets/images/drink_milk_coffee_1794658864757.jpg';
const IMG_CHOC_VANILLA = '/src/assets/images/drink_chocolate_vanilla_1794658865117.jpg';
const IMG_CITRUS = '/src/assets/images/drink_citrus_sparkling_1794658864872.jpg';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'espresso-pouch',
    name: 'Espresso Pouch',
    cartKey: 'Espresso Pouch',
    price: 10000,
    imageUrl: '/assets/aistudio/DSHYT_Espresso_Pouch__d2a07a57.png',
    fallbackImageUrl: IMG_ESPRESSO,
    category: 'Espresso & Black',
    note: 'Ekstraksi espresso pekat dalam kemasan pouch praktis siap seduh.',
  },
  {
    id: 'americano-original',
    name: 'Americano Original',
    cartKey: 'Americano Original',
    price: 10000,
    imageUrl: '/assets/aistudio/Dshyt_Aemericano_Original_d32980eb.jpg',
    fallbackImageUrl: IMG_ESPRESSO,
    category: 'Espresso & Black',
    note: 'Espresso double shot dengan air mineral dingin, bersih dan bertenaga.',
  },
  {
    id: 'americano-lemon',
    name: 'Americano Lemon',
    cartKey: 'Americano Lemon',
    price: 10000,
    imageUrl: '/assets/aistudio/Dshyt_Americano_Lemon_86ac4d3e.jpg',
    fallbackImageUrl: IMG_CITRUS,
    category: 'Citrus & Sparkling',
    note: 'Americano segar berpadu perasan lemon cerah untuk fokus seharian.',
  },
  {
    id: 'orange-blanc-coffee',
    name: 'Orange Blanc Coffee',
    cartKey: 'Orange Blanc Coffee',
    price: 16000,
    imageUrl: '/assets/aistudio/DSHYT_Orange_Blanc_Coffee_5fcbfecb.jpg',
    fallbackImageUrl: IMG_ORANGE_COFFEE,
    category: 'Citrus & Sparkling',
    note: 'Perpaduan jus jeruk manis, krim lembut, dan shot espresso aromatik.',
  },
  {
    id: 'blanc-dshyt',
    name: "Blanc D'SHYT",
    cartKey: 'Blanc DSHYT',
    price: 15000,
    imageUrl: '/assets/aistudio/DSHYT_blanc_f2e00078.jpg',
    fallbackImageUrl: IMG_MILK_COFFEE,
    category: 'Signature & Susu',
    note: 'Racikan susu putih creamy andalan dengan karakter manis seimbang.',
  },
  {
    id: 'chocolate-vanilla',
    name: 'Chocolate Vanilla',
    cartKey: 'Chocolate Vanilla',
    price: 14000,
    imageUrl: '/assets/aistudio/Dshyt_Chocolate_vanilla_ebab28ca.jpg',
    fallbackImageUrl: IMG_CHOC_VANILLA,
    category: 'Signature & Susu',
    note: 'Cokelat pekat non-kopi berpadu aroma vanila halus dan susu segar.',
  },
  {
    id: 'coffee-vanilla-milk',
    name: 'Coffee Vanilla Milk',
    cartKey: 'Coffee Vanilla Milk',
    price: 14000,
    imageUrl: '/assets/aistudio/DSHYT_Coffee_vanila_milk_4a08c3bf.jpg',
    fallbackImageUrl: IMG_MILK_COFFEE,
    category: 'Signature & Susu',
    note: 'Kopi susu dingin dengan sentuhan sirup vanila lembut yang nyaman.',
  },
  {
    id: 'mochachino',
    name: 'Mochachino',
    cartKey: 'Mochachino',
    price: 14000,
    imageUrl: '/assets/aistudio/DSHYT_Mochachino_ba008fa3.jpg',
    fallbackImageUrl: IMG_CHOC_VANILLA,
    category: 'Signature & Susu',
    note: 'Keseimbangan klasik antara cokelat kaya rasa, susu, dan espresso.',
  },
  {
    id: 'orange-blanc',
    name: 'Orange Blanc',
    cartKey: 'Orange Blanc',
    price: 15000,
    imageUrl: '/assets/aistudio/DSHYT_Orange_Blanc_dd046048.jpg',
    fallbackImageUrl: IMG_ORANGE_COFFEE,
    category: 'Citrus & Sparkling',
    note: 'Minuman jeruk creamy tanpa kopi yang ringan dan menyegarkan.',
  },
  {
    id: 'orange-sparkling',
    name: 'Orange Sparkling',
    cartKey: 'Orange Sparkling',
    price: 13000,
    imageUrl: '/assets/aistudio/DSHYT_Orange_Sparkling_673d5cd2.jpg',
    fallbackImageUrl: IMG_CITRUS,
    category: 'Citrus & Sparkling',
    note: 'Soda jeruk dingin dengan buih segar untuk mengusir kantuk siang.',
  },
  {
    id: 'coffee-milk-dshyt',
    name: "Coffee Milk D'SHYT",
    cartKey: 'Coffee Milk DSHYT',
    price: 13000,
    imageUrl: '/assets/aistudio/DSHYT_Coffee_Milk_3ce00d3b.jpg',
    fallbackImageUrl: IMG_MILK_COFFEE,
    category: 'Signature & Susu',
    note: 'Kopi susu signature harian dengan rasa manis pas dan body mantap.',
  },
];
