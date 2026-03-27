// src/screens/HomeScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getProfiles } from '../utils/storage';
import { PlayerProfile } from '../types';

// A default Guest profile to fallback on
const GUEST_PROFILE: PlayerProfile = {
  id: 'guest',
  name: 'Guest',
  colorHex: '#8D99AE',
  iconName: 'star',
  stats: { gamesPlayed: 0, wins: 0, ties: 0, correctGuesses: 0, highestNumber2Card: 0, highestNumber3Card: 0, highestNumber4Card: 0, highestNumber5Card: 0 }
};

// NEW: The permanent Robot profile!
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
  const [p2, setP2] = useState<PlayerProfile>(CPU_PROFILE); // Default P2 to the Robot!

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const saved = await getProfiles();
        // Inject the CPU right after the Guest
        setProfiles([GUEST_PROFILE, CPU_PROFILE, ...saved]); 
      };
      load();
    }, [])
  );

  
// ... keep your existing return statement and styles below this line exactly the same! ...
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Highest Number</Text>
        
        {/* --- LEVEL SELECTOR --- */}
        <Text style={styles.subtitle}>Cards per Player:</Text>
        <View style={styles.selectionRow}>
          {[2, 3, 4, 5].map((level) => (
            <TouchableOpacity 
              key={`level-${level}`}
              style={[styles.choiceBtn, selectedLevel === level && styles.choiceBtnActive]} 
              onPress={() => setSelectedLevel(level)}
            >
              <Text style={[styles.choiceText, selectedLevel === level && styles.choiceTextActive]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- ROUNDS SELECTOR --- */}
        <Text style={styles.subtitle}>Number of Rounds:</Text>
        <View style={styles.selectionRow}>
          {[1, 3, 5, 10].map((rounds) => (
            <TouchableOpacity 
              key={`rounds-${rounds}`}
              style={[styles.choiceBtn, selectedRounds === rounds && styles.choiceBtnActive]} 
              onPress={() => setSelectedRounds(rounds)}
            >
              <Text style={[styles.choiceText, selectedRounds === rounds && styles.choiceTextActive]}>{rounds}</Text>
            </TouchableOpacity>
          ))}
        </View>

{/* --- QUESTIONS SELECTOR --- */}
     <Text style={styles.subtitle}>Place Value Questions:</Text>
     <View style={styles.selectionRow}>
       <TouchableOpacity style={[styles.choiceBtn, { width: 100 }, questionsEnabled && styles.choiceBtnActive]} onPress={() => setQuestionsEnabled(true)}>
         <Text style={[styles.choiceText, questionsEnabled && styles.choiceTextActive]}>ON</Text>
       </TouchableOpacity>
       <TouchableOpacity style={[styles.choiceBtn, { width: 100 }, !questionsEnabled && styles.choiceBtnActive]} onPress={() => setQuestionsEnabled(false)}>
         <Text style={[styles.choiceText, !questionsEnabled && styles.choiceTextActive]}>OFF</Text>
       </TouchableOpacity>
     </View>

        {/* --- PLAYER 1 SELECTOR --- */}
        <Text style={styles.subtitle}>Player 1 (Bottom):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileScroller}>
          {profiles.map((profile) => (
            <TouchableOpacity 
              key={`p1-${profile.id}`}
              style={[styles.profileChip, p1.id === profile.id && { borderColor: profile.colorHex, backgroundColor: '#FAFAFA' }]}
              onPress={() => setP1(profile)}
            >
              <Text style={[styles.profileName, p1.id === profile.id && { color: profile.colorHex }]}>{profile.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* --- PLAYER 2 SELECTOR --- */}
        <Text style={styles.subtitle}>Player 2 (Top):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileScroller}>
          {profiles.map((profile) => (
            <TouchableOpacity 
              key={`p2-${profile.id}`}
              style={[styles.profileChip, p2.id === profile.id && { borderColor: profile.colorHex, backgroundColor: '#FAFAFA' }]}
              onPress={() => setP2(profile)}
            >
              <Text style={[styles.profileName, p2.id === profile.id && { color: profile.colorHex }]}>{profile.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* --- ACTION BUTTONS (in HomeScreen.tsx) --- */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.button, styles.playButton]} 
            onPress={() => navigation.navigate('GameMain', { level: selectedLevel, rounds: selectedRounds, p1Profile: p1, p2Profile: p2, questionsEnabled })}
            
          >
            <Text style={styles.buttonText}>Start Game</Text>
          </TouchableOpacity>

          {/* New side-by-side layout for Setup and Stats */}
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
  title: { fontSize: 36, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center', marginTop: 10 },
  // Centered the subtitles again
  subtitle: { fontSize: 18, color: '#666', marginBottom: 10, fontWeight: '600', textAlign: 'center' },
  // Centered the rows again
  selectionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 20 },
  choiceBtn: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#E1E8ED', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'transparent' },
  choiceBtnActive: { backgroundColor: '#FFF3B0', borderColor: '#FFD166' },
  choiceText: { fontSize: 20, fontWeight: 'bold', color: '#666' },
  choiceTextActive: { color: '#F77F00' },
  profileScroller: { flexDirection: 'row', marginBottom: 20, width: '100%', maxHeight: 55 },
  profileChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, borderWidth: 3, borderColor: '#DDD', backgroundColor: '#EEE', marginRight: 10, justifyContent: 'center' },
  profileName: { fontSize: 16, fontWeight: 'bold', color: '#666' },
  actionSection: { width: '100%', alignItems: 'center', marginTop: 10 },
  button: { width: '90%', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  playButton: { backgroundColor: '#8AC926' },
  profileButton: { backgroundColor: '#1982C4' },
  buttonText: { color: 'white', fontSize: 22, fontWeight: 'bold' }
});