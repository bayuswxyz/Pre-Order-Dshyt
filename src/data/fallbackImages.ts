import espressoImg from '../assets/images/drink_espresso_americano_1794658863394.jpg';
import orangeCoffeeImg from '../assets/images/drink_orange_coffee_1794658863590.jpg';
import milkCoffeeImg from '../assets/images/drink_milk_coffee_1794658864757.jpg';
import chocVanillaImg from '../assets/images/drink_chocolate_vanilla_1794658865117.jpg';
import citrusImg from '../assets/images/drink_citrus_sparkling_1794658864872.jpg';
import type { FallbackImageKey } from './menu';

export const FALLBACK_IMAGES: Record<FallbackImageKey, string> = {
  espresso: espressoImg,
  orangeCoffee: orangeCoffeeImg,
  milkCoffee: milkCoffeeImg,
  chocVanilla: chocVanillaImg,
  citrus: citrusImg,
};
