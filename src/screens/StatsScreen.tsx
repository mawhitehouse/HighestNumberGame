// src/screens/StatsScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getProfiles } from '../utils/storage';
import { PlayerProfile } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type SortOption = 'wins' | 'games' | 'guesses';

export default function StatsScreen() {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('wins');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const saved = await getProfiles();
        setProfiles(saved);
      };
      load();
    }, [])
  );

  // Math helpers to safely calculate percentages without dividing by zero
  const getWinPercent = (wins: number, games: number) => games > 0 ? Math.round((wins / games) * 100) : 0;
  const getGuessPercent = (guesses: number, games: number) => games > 0 ? Math.round((guesses / games) * 100) : 0;

  const sortedProfiles = [...profiles].sort((a, b) => {
    if (sortBy === 'wins') {
      const aWinPct = getWinPercent(a.stats.wins, a.stats.gamesPlayed);
      const bWinPct = getWinPercent(b.stats.wins, b.stats.gamesPlayed);
      return bWinPct - aWinPct || b.stats.wins - a.stats.wins; // Sort by %, then raw wins
    }
    if (sortBy === 'games') {
      return b.stats.gamesPlayed - a.stats.gamesPlayed;
    }
    if (sortBy === 'guesses') {
      const aGuessPct = getGuessPercent(a.stats.correctGuesses, a.stats.gamesPlayed);
      const bGuessPct = getGuessPercent(b.stats.correctGuesses, b.stats.gamesPlayed);
      return bGuessPct - aGuessPct;
    }
    return 0;
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>

      {/* --- SORTING CONTROLS --- */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity style={[styles.sortBtn, sortBy === 'wins' && styles.sortBtnActive]} onPress={() => setSortBy('wins')}>
          <Text style={[styles.sortText, sortBy === 'wins' && styles.sortTextActive]}>Win %</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sortBtn, sortBy === 'guesses' && styles.sortBtnActive]} onPress={() => setSortBy('guesses')}>
          <Text style={[styles.sortText, sortBy === 'guesses' && styles.sortTextActive]}>Guess %</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sortBtn, sortBy === 'games' && styles.sortBtnActive]} onPress={() => setSortBy('games')}>
          <Text style={[styles.sortText, sortBy === 'games' && styles.sortTextActive]}>Games</Text>
        </TouchableOpacity>
      </View>

      {/* --- STATS LIST --- */}
      <FlatList
        data={sortedProfiles}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item, index }) => {
          const winPct = getWinPercent(item.stats.wins, item.stats.gamesPlayed);
          const guessPct = getGuessPercent(item.stats.correctGuesses, item.stats.gamesPlayed);

          return (
            <View style={[styles.statCard, { borderTopColor: item.colorHex }]}>
              <View style={styles.cardHeader}>
                <View style={styles.nameRow}>
                  <Text style={styles.rank}>#{index + 1}</Text>
                  <MaterialCommunityIcons name={item.iconName || 'star'} size={24} color={item.colorHex} />
                  <Text style={styles.playerName}>{item.name}</Text>
                </View>
                <Text style={styles.gamesText}>{item.stats.gamesPlayed} Rounds Played</Text>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>{item.stats.wins}</Text>
                  <Text style={styles.metricLabel}>Wins</Text>
                  <Text style={[styles.metricHighlight, { color: '#8AC926' }]}>{winPct}%</Text>
                </View>

                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>{item.stats.correctGuesses}</Text>
                  <Text style={styles.metricLabel}>Correct Guesses</Text>
                  <Text style={[styles.metricHighlight, { color: '#1982C4' }]}>{guessPct}%</Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666' }}>No stats available yet!</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 20, marginBottom: 10 },
  sortRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 10 },
  sortLabel: { fontSize: 16, color: '#666', fontWeight: 'bold', marginRight: 5 },
  sortBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#E1E8ED' },
  sortBtnActive: { backgroundColor: '#FFD166' },
  sortText: { fontWeight: 'bold', color: '#666' },
  sortTextActive: { color: '#D66800' },
  statCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, borderTopWidth: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rank: { fontSize: 18, fontWeight: 'bold', color: '#999' },
  playerName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  gamesText: { color: '#666', fontWeight: '600' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  metricBox: { alignItems: 'center' },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  metricLabel: { fontSize: 12, color: '#999', textTransform: 'uppercase', marginTop: 2 },
  metricHighlight: { fontSize: 16, fontWeight: 'bold', marginTop: 4 }
});