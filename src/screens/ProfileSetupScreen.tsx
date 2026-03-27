// src/screens/ProfileSetupScreen.tsx
import React, { useState, useCallback } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, FlatList, SafeAreaView, Alert, 
  ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PlayerProfile, CardIconName } from '../types';
import { getProfiles, saveProfile, updateProfile, deleteProfile } from '../utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = ['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93', '#FF924C', '#FF99C8', '#4CC9F0'];
const ICONS: CardIconName[] = ['rocket', 'star', 'heart', 'lightning-bolt', 'flower', 'alien', 'paw', 'car-sports'];

export default function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState<CardIconName>(ICONS[0]);
  const [savedProfiles, setSavedProfiles] = useState<PlayerProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<PlayerProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [])
  );

  const loadProfiles = async () => {
    const profiles = await getProfiles();
    setSavedProfiles(profiles);
  };

  const handleSaveOrUpdate = async () => {
    if (name.trim() === '') return;

    if (editingProfile) {
      const updatedProfile: PlayerProfile = { ...editingProfile, name: name.trim(), colorHex: selectedColor, iconName: selectedIcon };
      await updateProfile(updatedProfile);
    } else {
      const newProfile: PlayerProfile = {
        id: Date.now().toString(),
        name: name.trim(),
        colorHex: selectedColor,
        iconName: selectedIcon,
        stats: { gamesPlayed: 0, wins: 0, ties: 0, correctGuesses: 0, highestNumber2Card: 0, highestNumber3Card: 0, highestNumber4Card: 0, highestNumber5Card: 0 }
      };
      await saveProfile(newProfile);
    }
    resetForm();
    loadProfiles();
  };

  const handleEditTap = (profile: PlayerProfile) => {
    setEditingProfile(profile);
    setName(profile.name);
    setSelectedColor(profile.colorHex);
    setSelectedIcon(profile.iconName || ICONS[0]);
  };

  const handleDeleteTap = (id: string, profileName: string) => {
    Alert.alert("Delete Profile", `Are you sure you want to delete ${profileName}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteProfile(id); if (editingProfile?.id === id) resetForm(); loadProfiles(); } }
    ]);
  };

  const resetForm = () => {
    setEditingProfile(null);
    setName('');
    setSelectedColor(COLORS[0]);
    setSelectedIcon(ICONS[0]);
  };



  // Move the form into a reusable component that sits at the top of the list
  const renderHeader = () => (
    <View style={styles.inputSection}>
      <Text style={styles.header}>{editingProfile ? "Edit Player" : "Create a Player"}</Text>
      
      <TextInput style={styles.input} placeholder="Enter Player Name" value={name} onChangeText={setName} maxLength={12} />

      <Text style={styles.subHeader}>Pick a Color:</Text>
      <View style={styles.gridPalette}>
        {COLORS.map((color) => (
          <TouchableOpacity key={color} style={[styles.colorCircle, { backgroundColor: color }, selectedColor === color && styles.selectedRing]} onPress={() => setSelectedColor(color)} />
        ))}
      </View>

      <Text style={styles.subHeader}>Pick an Icon:</Text>
      <View style={styles.gridPalette}>
        {ICONS.map((icon) => (
          <TouchableOpacity key={icon} style={[styles.iconBox, selectedIcon === icon && { borderColor: selectedColor, backgroundColor: '#F0F0F0' }]} onPress={() => setSelectedIcon(icon)}>
            <MaterialCommunityIcons name={icon} size={32} color={selectedIcon === icon ? selectedColor : '#8D99AE'} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: selectedColor }]} onPress={handleSaveOrUpdate}>
          <Text style={styles.saveButtonText}>{editingProfile ? "Update Profile" : "Save Profile"}</Text>
        </TouchableOpacity>
        {editingProfile && (
          <TouchableOpacity style={styles.cancelButton} onPress={resetForm}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
        )}
      </View>
      
      <View style={styles.divider} />
      <Text style={styles.header}>Saved Players</Text>
    </View>
  );




  // ... keep your state and functions exactly the same ...

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* --- FORM SECTION --- */}
        <View style={styles.inputSection}>
          <Text style={styles.header}>{editingProfile ? "Edit Player" : "Create a Player"}</Text>
          
          <TextInput style={styles.input} placeholder="Enter Player Name" value={name} onChangeText={setName} maxLength={12} />

          <Text style={styles.subHeader}>Pick a Color:</Text>
          <View style={styles.gridPalette}>
            {COLORS.map((color) => (
              <TouchableOpacity key={color} style={[styles.colorCircle, { backgroundColor: color }, selectedColor === color && styles.selectedRing]} onPress={() => setSelectedColor(color)} />
            ))}
          </View>

          <Text style={styles.subHeader}>Pick an Icon:</Text>
          <View style={styles.gridPalette}>
            {ICONS.map((icon) => (
              <TouchableOpacity key={icon} style={[styles.iconBox, selectedIcon === icon && { borderColor: selectedColor, backgroundColor: '#F0F0F0' }]} onPress={() => setSelectedIcon(icon)}>
                <MaterialCommunityIcons name={icon} size={32} color={selectedIcon === icon ? selectedColor : '#8D99AE'} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: selectedColor }]} onPress={handleSaveOrUpdate}>
              <Text style={styles.saveButtonText}>{editingProfile ? "Update Profile" : "Save Profile"}</Text>
            </TouchableOpacity>
            {editingProfile && (
              <TouchableOpacity style={styles.cancelButton} onPress={resetForm}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
            )}
          </View>
          
          <View style={styles.divider} />
          <Text style={styles.header}>Saved Players</Text>
        </View>

        {/* --- SAVED PROFILES SECTION --- */}
        {savedProfiles.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>No players saved yet!</Text>
        ) : (
          savedProfiles.map((item) => (
            <View key={item.id} style={[styles.profileCard, { borderLeftColor: item.colorHex }]}>
              <View style={styles.profileInfo}>
                <MaterialCommunityIcons name={item.iconName || 'star'} size={28} color={item.colorHex} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.profileName}>{item.name}</Text>
                  <Text style={styles.profileStats}>Played: {item.stats.gamesPlayed} | Wins: {item.stats.wins}</Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleEditTap(item)} style={styles.iconBtn}><MaterialCommunityIcons name="pencil" size={24} color="#666" /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteTap(item.id, item.name)} style={styles.iconBtn}><MaterialCommunityIcons name="trash-can-outline" size={24} color="#EF476F" /></TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
// Keep your existing styles!









const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  inputSection: { padding: 20, backgroundColor: '#F8F9FA' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  subHeader: { fontSize: 16, marginBottom: 10, color: '#666', fontWeight: '600' },
  input: { borderWidth: 2, borderColor: '#DDD', borderRadius: 10, padding: 15, fontSize: 18, marginBottom: 20, backgroundColor: 'white' },
  gridPalette: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 25 },
  colorCircle: { width: 45, height: 45, borderRadius: 25, borderWidth: 3, borderColor: 'transparent' },
  selectedRing: { borderColor: '#333' },
  iconBox: { width: 55, height: 55, borderRadius: 10, borderWidth: 2, borderColor: '#EEE', backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  actionButtons: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  saveButton: { flex: 2, padding: 15, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  cancelButton: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', backgroundColor: '#DDD' },
  cancelButtonText: { color: '#333', fontSize: 18, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#DDD', marginVertical: 20 },
  profileCard: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginHorizontal: 20, marginBottom: 10, borderLeftWidth: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  profileStats: { color: '#666', marginTop: 4, fontSize: 12 },
  cardActions: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 5 }
});