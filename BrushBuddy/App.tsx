import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import IntroScreen from './src/screens/IntroScreen';
import RoutineScreen from './src/screens/RoutineScreen';

export type AppScreen = 'intro' | 'routine';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('intro');

  const navigateToScreen = (screen: AppScreen) => {
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'intro':
        return <IntroScreen onStartBrushing={() => navigateToScreen('routine')} />;
      case 'routine':
        return <RoutineScreen onStartOver={() => navigateToScreen('intro')} />;
      default:
        return <IntroScreen onStartBrushing={() => navigateToScreen('routine')} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
});
