// src/screens/HomeScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getProfiles } from '../utils/storage';
import { PlayerProfile } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// A default Guest profile to fallback on
const GUEST_PROFILE: PlayerProfile = {
  id: 'guest',
  name: 'Guest',
  colorHex: '#8D99AE',
  iconName: 'star',
  stats: { gamesPlayed: 0, wins: 0, ties: 0, correctGuesses: 0, highestNumber2Card: 0, highestNumber3Card: 0, highestNumber4Card: 0, highestNumber5Card: 0 }
};

// The permanent Robot profile!
const CPU_PROFILE: PlayerProfile = {
  id: 'cpu',
  name: 'Robot 🤖',
  colorHex: '#6A4C93',
  iconName: 'robot',
  stats: { gamesPlayed: 0, wins: 0, ties: 0, correctGuesses: 0, highestNumber2Card: 0, highestNumber3Card: 0, highestNumber4Card: 0, highestNumber5Card: 0 }
};

export default function HomeScreen({ navigation }: any) {
  const [selectedLevel, setSelectedLevel] = useState(2);
  const [selectedRounds, setSelectedRounds] = useState(3);
  const [questionsEnabled, setQuestionsEnabled] = useState(true);
  
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [p1, setP1] = useState<PlayerProfile>(GUEST_PROFILE);
  const [p2, setP2] = useState<PlayerProfile>(CPU_PROFILE); // Default P2 to the Robot

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const saved = await getProfiles();
        const allProfiles = [GUEST_PROFILE, CPU_PROFILE, ...saved];
        setProfiles(allProfiles);
        
        // Safety check: If p1 was somehow set to CPU, reset it to Guest
        if (p1.id === 'cpu') setP1(GUEST_PROFILE);
      };
      load();
    }, [p1.id])
  );

  // A reusable component for the horizontal profile scrolling lists
  const renderProfileSelector = (
    title: string, 
    selectedProfile: PlayerProfile, 
    onSelect: (p: PlayerProfile) => void, 
    availableProfiles: PlayerProfile[]
  ) => (
    <View style={styles.selectorSection}>
      <Text style={styles.subtitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileScroll}>
        {availableProfiles.map(profile => (
          <TouchableOpacity 
            key={profile.id} 
            style={[
              styles.profilePill, 
              selectedProfile.id === profile.id && { borderColor: profile.colorHex, backgroundColor: profile.colorHex + '20' }
            ]}
            onPress={() => onSelect(profile)}
          >
            <MaterialCommunityIcons name={profile.iconName || 'star'} size={20} color={profile.colorHex} />
            <Text style={[styles.profilePillText, selectedProfile.id === profile.id && { color: profile.colorHex, fontWeight: 'bold' }]}>
              {profile.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Highest Number!</Text>

        {/* --- LEVEL SELECTOR --- */}
        <Text style={styles.subtitle}>How many cards?</Text>
        <View style={styles.selectionRow}>
          {[2, 3, 4, 5].map(level => (
            <TouchableOpacity key={`level-${level}`} style={[styles.choiceBtn, selectedLevel === level && styles.choiceBtnActive]} onPress={() => setSelectedLevel(level)}>
              <Text style={[styles.choiceText, selectedLevel === level && styles.choiceTextActive]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- ROUNDS SELECTOR --- */}
        <Text style={styles.subtitle}>Number of Rounds:</Text>
        <View style={styles.selectionRow}>
          {[1, 3, 5].map(rounds => (
            <TouchableOpacity key={`rounds-${rounds}`} style={[styles.choiceBtn, selectedRounds === rounds && styles.choiceBtnActive]} onPress={() => setSelectedRounds(rounds)}>
              <Text style={[styles.choiceText, selectedRounds === rounds && styles.choiceTextActive]}>{rounds}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- QUESTIONS TOGGLE --- */}
        <Text style={styles.subtitle}>Place Value Questions:</Text>
        <View style={styles.selectionRow}>
          <TouchableOpacity style={[styles.choiceBtn, { width: 100 }, questionsEnabled && styles.choiceBtnActive]} onPress={() => setQuestionsEnabled(true)}>
            <Text style={[styles.choiceText, questionsEnabled && styles.choiceTextActive]}>ON</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.choiceBtn, { width: 100 }, !questionsEnabled && styles.choiceBtnActive]} onPress={() => setQuestionsEnabled(false)}>
            <Text style={[styles.choiceText, !questionsEnabled && styles.choiceTextActive]}>OFF</Text>
          </TouchableOpacity>
        </View>

        {/* --- PLAYER SELECTORS --- */}
        
        {/* Player 1: Filter out the CPU profile here! */}
        {renderProfileSelector(
          "Player 1:", 
          p1, 
          setP1, 
          profiles.filter(p => p.id !== 'cpu')
        )}

        {/* Player 2: Keep the CPU in the list */}
        {renderProfileSelector(
          "Player 2:", 
          p2, 
          setP2, 
          profiles
        )}

        {/* --- ACTION BUTTONS --- */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.button, styles.playButton]} 
            onPress={() => navigation.navigate('GameMain', { level: selectedLevel, rounds: selectedRounds, p1Profile: p1, p2Profile: p2, questionsEnabled })}
          >
            <Text style={styles.buttonText}>Start Game</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 10, width: '90%' }}>
            <TouchableOpacity style={[styles.button, styles.profileButton, { flex: 1 }]} onPress={() => navigation.navigate('ProfileSetup')}>
              <Text style={styles.buttonText}>Setup Players</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, { backgroundColor: '#6A4C93', flex: 1 }]} onPress={() => navigation.navigate('Stats')}>
              <Text style={styles.buttonText}>View Stats</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20, alignItems: 'center', paddingBottom: 40 },
  title: { fontSize: 36, fontWeight: '900', color: '#333', marginBottom: 20, marginTop: 10 },
  subtitle: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 15, marginBottom: 10, alignSelf: 'flex-start', width: '100%' },
  selectionRow: { flexDirection: 'row', gap: 10, marginBottom: 10, width: '100%', justifyContent: 'flex-start' },
  choiceBtn: { backgroundColor: '#E1E8ED', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, minWidth: 60, alignItems: 'center' },
  choiceBtnActive: { backgroundColor: '#FFD166' },
  choiceText: { fontSize: 18, fontWeight: 'bold', color: '#666' },
  choiceTextActive: { color: '#D66800' },
  selectorSection: { width: '100%', marginBottom: 15 },
  profileScroll: { paddingVertical: 5, gap: 10 },
  profilePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 2, borderColor: '#DDD', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 25, gap: 8 },
  profilePillText: { fontSize: 16, color: '#666' },
  actionSection: { width: '100%', alignItems: 'center', marginTop: 30, gap: 15 },
  button: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  playButton: { backgroundColor: '#8AC926', width: '90%' },
  profileButton: { backgroundColor: '#1982C4' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});