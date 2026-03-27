// src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerProfile } from '../types';

const PROFILES_KEY = '@player_profiles';

// Fetch all saved profiles
export const getProfiles = async (): Promise<PlayerProfile[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(PROFILES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading profiles', e);
    return [];
  }
};

// Save a new profile
export const saveProfile = async (newProfile: PlayerProfile): Promise<void> => {
  try {
    const existingProfiles = await getProfiles();
    const updatedProfiles = [...existingProfiles, newProfile];
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
  } catch (e) {
    console.error('Error saving profile', e);
  }
};

// Add these to the bottom of src/utils/storage.ts

// Update an existing profile
export const updateProfile = async (updatedProfile: PlayerProfile): Promise<void> => {
  try {
    const profiles = await getProfiles();
    const newProfiles = profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p);
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(newProfiles));
  } catch (e) {
    console.error('Error updating profile', e);
  }
};

// Delete a profile completely
export const deleteProfile = async (id: string): Promise<void> => {
  try {
    const profiles = await getProfiles();
    const newProfiles = profiles.filter(p => p.id !== id);
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(newProfiles));
  } catch (e) {
    console.error('Error deleting profile', e);
  }
};