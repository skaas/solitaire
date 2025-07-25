export interface Card {
  id: number;
  value: number;
  color: string;
}

export interface Column {
  id: number;
  cards: Card[];
} 