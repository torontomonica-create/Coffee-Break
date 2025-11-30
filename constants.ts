import { CoffeeType } from './types';

export const MAX_SIPS = 30;
export const DEFAULT_DURATION = 300; // 5 minutes default
export const MIN_DURATION = 60;      // 1 minute
export const MAX_DURATION = 300;     // 5 minutes
export const DURATION_STEP = 30;     // 30 seconds steps

export const COFFEE_CONFIG = {
  [CoffeeType.ICED_COFFEE]: {
    name: 'Iced Coffee',
    description: 'Cool and refreshing',
    color: 'bg-amber-900/90', // Dark liquid
    cupStyle: 'rounded-b-md', // Straighter glass
    hasIce: true,
    hasFoam: false,
    textColor: 'text-amber-900',
  },
  [CoffeeType.DOUBLE_DOUBLE]: {
    name: 'Double Double',
    description: 'Two sugars, two creams',
    color: 'bg-[#C69C6D]', // Creamy coffee
    cupStyle: 'rounded-b-[2rem]', // Mug shape
    hasIce: false,
    hasFoam: false,
    textColor: 'text-[#8a5a4d]',
  },
  [CoffeeType.CAPPUCCINO]: {
    name: 'Cappuccino',
    description: 'Full of soft foam',
    color: 'bg-[#A67B5B]', // Medium roast
    cupStyle: 'rounded-b-[3rem]', // Bowl shape cup
    hasIce: false,
    hasFoam: true,
    textColor: 'text-[#6f453b]',
  }
};