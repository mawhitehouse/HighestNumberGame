// src/utils/deck.ts
import { PlayingCard, CardColor } from '../types';

const COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

// Generates a complete 60-card deck (0-9 for each of the 6 colors)
export const generateDeck = (): PlayingCard[] => {
  const deck: PlayingCard[] = [];
  
  COLORS.forEach((color) => {
    for (let i = 0; i <= 9; i++) {
      deck.push({
        id: `${color}-${i}-${Math.random().toString(36).substring(7)}`, // Ensures unique keys even if we duplicate decks later
        value: i,
        color: color,
      });
    }
  });

  return shuffleDeck(deck);
};

// Fisher-Yates shuffle algorithm
export const shuffleDeck = (deck: PlayingCard[]): PlayingCard[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Draws cards from the deck, ensuring we don't return all zeros
export const drawCards = (deck: PlayingCard[], numCards: number): { drawn: PlayingCard[], remainingDeck: PlayingCard[] } => {
  if (deck.length < numCards) {
    throw new Error("Not enough cards left in the deck!");
  }

  let drawn = deck.slice(0, numCards);
  let remainingDeck = deck.slice(numCards);

  // Check the "All Zeros" problem you identified earlier
  const allZeros = drawn.every(card => card.value === 0);
  
  if (allZeros) {
    // If they are all zero, find the first non-zero card in the remaining deck
    const nonZeroIndex = remainingDeck.findIndex(card => card.value !== 0);
    
    if (nonZeroIndex !== -1) {
      // Swap the last zero card with the non-zero card
      const replacementCard = remainingDeck[nonZeroIndex];
      remainingDeck[nonZeroIndex] = drawn[drawn.length - 1];
      drawn[drawn.length - 1] = replacementCard;
    }
  }

  return { drawn, remainingDeck };
};