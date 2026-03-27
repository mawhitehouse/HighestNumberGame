// src/components/Card.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder } from 'react-native';
import { PlayingCard } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CardProps {
  card: PlayingCard;
  isFaceUp: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  onSwipe?: () => void;
  width?: number;
  pattern?: keyof typeof MaterialCommunityIcons.glyphMap;
}

const getCardColorHex = (color: string) => {
  switch (color) {
    case 'red': return '#EF476F'; case 'blue': return '#118AB2'; case 'green': return '#06D6A0';
    case 'yellow': return '#FFD166'; case 'purple': return '#8338EC'; case 'orange': return '#F77F00';
    default: return '#333';
  }
};

export default function Card({ card, isFaceUp, isSelected = false, onPress, onSwipe, width = 80, pattern = 'star' }: CardProps) {
  const height = width * 1.4; 

  // --- NEW: This keeps the swipe action perfectly up-to-date! ---
  const onSwipeRef = useRef(onSwipe);
  useEffect(() => {
    onSwipeRef.current = onSwipe;
  }, [onSwipe]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only take over if the user physically drags their finger
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (Math.abs(gestureState.dy) > 20 || Math.abs(gestureState.dx) > 20) {
          if (onSwipeRef.current) onSwipeRef.current(); // Uses the fresh ref!
        }
      }
    })
  ).current;

  if (!isFaceUp) {
    return (
      <View {...panResponder.panHandlers}>
        <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={!onPress}>
          <View style={[styles.cardBase, { width, height, backgroundColor: '#2B2D42' }]}>
            <View style={styles.cardBackInner}>
              <MaterialCommunityIcons name={pattern} size={width * 0.5} color="#8D99AE" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  const bgColor = getCardColorHex(card.color);

  return (
    <View {...panResponder.panHandlers}>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={!onPress}>
        <View style={[
          styles.cardBase, 
          { width, height, backgroundColor: 'white', borderColor: bgColor, borderWidth: 4 },
          isSelected && styles.selectedCard
        ]}>
          <View style={[styles.centerOval, { backgroundColor: bgColor }]}>
            <Text style={styles.centerText}>{card.value}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardBase: { borderRadius: 10, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 4, margin: 5 },
  selectedCard: { transform: [{ translateY: -10 }], shadowColor: '#FFD166', shadowOpacity: 0.8, shadowRadius: 8, elevation: 10, borderColor: '#333' },
  cardBackInner: { width: '80%', height: '80%', borderWidth: 2, borderColor: '#8D99AE', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  centerOval: { width: '60%', height: '70%', borderRadius: 100, justifyContent: 'center', alignItems: 'center' },
  centerText: { fontSize: 40, fontWeight: 'bold', color: 'white' }
});