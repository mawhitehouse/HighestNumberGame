// src/types/index.ts

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

// Define the exact list of fun icons we will let kids choose from
export type CardIconName = 'rocket' | 'star' | 'heart' | 'lightning-bolt' | 'flower' | 'alien' | 'paw' | 'car-sports'| 'robot';

export interface PlayingCard {
  id: string;
  value: number;
  color: CardColor;
}

export interface PlayerProfile {
  id: string;
  name: string;
  colorHex: string;
  iconName: CardIconName; // Replaced the old "pattern" with this
  stats: {
    gamesPlayed: number;
    wins: number;
    ties: number;
    correctGuesses: number;
    highestNumber2Card: number;
    highestNumber3Card: number;
    highestNumber4Card: number;
    highestNumber5Card: number;
  };
}

export type RootStackParamList = {
  Home: undefined;
  ProfileSetup: undefined;
  GameMain: { level: 2 | 3 | 4 | 5 };
  Stats: undefined;
};