// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { RootStackParamList } from './src/types';

// Import our real screens
import HomeScreen from './src/screens/HomeScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import GameMainScreen from './src/screens/GameMainScreen';
import StatsScreen from './src/screens/StatsScreen';

// We will keep GameMain as a placeholder just for a moment


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ title: 'Setup Players' }} />
        <Stack.Screen name="GameMain" component={GameMainScreen} options={{ title: 'Play!', headerShown: false }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Player Stats' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}