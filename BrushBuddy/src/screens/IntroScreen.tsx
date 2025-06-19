import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import speechService from '../services/speechService';
import voiceService, { VoiceRecognitionResult } from '../services/voiceService';
import { routineSteps } from '../data/routineSteps';

interface IntroScreenProps {
  onStartBrushing: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onStartBrushing }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const introStep = routineSteps[0]; // Get the intro step

  useEffect(() => {
    initializeServices();
    speakWelcomeMessage();

    return () => {
      voiceService.stopListening();
      speechService.stop();
    };
  }, []);

  const initializeServices = async () => {
    try {
      await voiceService.initialize();
      const hasPermission = await voiceService.requestPermissions();
      
      if (!hasPermission) {
        Alert.alert(
          'Microphone Permission',
          'Voice commands are disabled. You can still use the buttons to navigate.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  };

  const speakWelcomeMessage = async () => {
    try {
      setIsSpeaking(true);
      await speechService.speakForKids(introStep.dialogue);
      setIsSpeaking(false);
      startListening();
    } catch (error) {
      console.error('Error speaking welcome message:', error);
      setIsSpeaking(false);
      startListening();
    }
  };

  const startListening = async () => {
    if (!voiceService.getIsAvailable() || isSpeaking) {
      return;
    }

    try {
      await voiceService.startListening({
        onStart: () => {
          setIsListening(true);
          setRecognizedText('');
        },
        onResult: handleVoiceResult,
        onError: (error) => {
          console.error('Voice recognition error:', error);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
    } catch (error) {
      console.error('Failed to start listening:', error);
    }
  };

  const handleVoiceResult = (result: VoiceRecognitionResult) => {
    setRecognizedText(result.originalText);

    if (result.command === 'start_brushing') {
      handleStartBrushing();
    } else if (result.command === 'unknown') {
      speakRetryMessage();
    }
  };

  const speakRetryMessage = async () => {
    try {
      setIsSpeaking(true);
      voiceService.stopListening();
      await speechService.speakForKids("Didn't quite get that. Please say 'Start Brushing' or tap the button!");
      setIsSpeaking(false);
      setTimeout(startListening, 500);
    } catch (error) {
      console.error('Error speaking retry message:', error);
      setIsSpeaking(false);
      setTimeout(startListening, 500);
    }
  };

  const handleStartBrushing = () => {
    voiceService.stopListening();
    speechService.stop();
    onStartBrushing();
  };

  // Simulate voice input for testing (remove in production)
  const simulateVoiceCommand = (command: string) => {
    voiceService.simulateVoiceInput(command);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Welcome Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>🦷 Brush Buddy 🦷</Text>
          <Text style={styles.welcomeText}>{introStep.dialogue}</Text>
        </View>

        {/* Voice Status */}
        <View style={styles.voiceStatusContainer}>
          {isListening && (
            <Text style={styles.listeningText}>🎤 Listening...</Text>
          )}
          {recognizedText && (
            <Text style={styles.recognizedText}>Heard: "{recognizedText}"</Text>
          )}
          {isSpeaking && (
            <Text style={styles.speakingText}>🗣️ Speaking...</Text>
          )}
        </View>

        {/* Microphone Hint */}
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            💡 Make sure your microphone is enabled for voice commands!
          </Text>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startButton, isSpeaking && styles.disabledButton]}
          onPress={handleStartBrushing}
          disabled={isSpeaking}
        >
          <Text style={styles.startButtonText}>Start Brushing! 🚀</Text>
        </TouchableOpacity>

        {/* Prompt */}
        <Text style={styles.promptText}>{introStep.prompt}</Text>

        {/* Debug buttons for testing (remove in production) */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => simulateVoiceCommand('start brushing')}
            >
              <Text style={styles.debugButtonText}>Test: "Start Brushing"</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E86AB',
    textAlign: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  voiceStatusContainer: {
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  listeningText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  recognizedText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  speakingText: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: '600',
  },
  hintContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    width: width - 40,
  },
  hintText: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  promptText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  debugContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  debugButton: {
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
  },
});

export default IntroScreen;
