export enum CoffeeType {
  ICED_COFFEE = 'ICED_COFFEE',
  DOUBLE_DOUBLE = 'DOUBLE_DOUBLE',
  CAPPUCCINO = 'CAPPUCCINO'
}

export enum AppStatus {
  MENU = 'MENU',
  DRINKING = 'DRINKING',
  FINISHED = 'FINISHED'
}

export interface CoffeeStats {
  iced: number;
  double: number;
  cappuccino: number;
  totalUsers: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean; // true if sent by current user, false if Barista or other
  sender?: string;
  timestamp: number;
}