import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
  const [voiceStatus, setVoiceStatus] = useState<string>('Initializing...');

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
      console.log('🎤 IntroScreen: Initializing voice services...');
      setVoiceStatus('Initializing voice service...');

      const initialized = await voiceService.initialize();
      console.log('🎤 IntroScreen: Voice service initialized:', initialized);

      // Ensure voice service is available
      voiceService.ensureAvailable();

      // Log the voice service status
      voiceService.logStatus();

      const hasPermission = await voiceService.requestPermissions();
      console.log('🎤 IntroScreen: Permissions granted:', hasPermission);

      if (!hasPermission) {
        setVoiceStatus('Microphone permission denied - using simulated mode');
        console.log('🎤 IntroScreen: No permissions, but continuing with simulated mode');
      } else {
        const status = voiceService.getStatus();
        const mode = status.useRealVoice ? 'Real' : status.useWebSpeech ? 'Web Speech' : 'Simulated';
        setVoiceStatus(`Voice mode: ${mode} (${status.platform})`);
      }

      console.log('🎤 IntroScreen: Voice service setup complete');
    } catch (error) {
      console.error('❌ IntroScreen: Failed to initialize services:', error);
      setVoiceStatus('Using simulated voice mode');
      // Ensure voice service is still available in simulated mode
      voiceService.ensureAvailable();
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
    console.log('🎤 IntroScreen: startListening called');
    console.log('🎤 IntroScreen: Voice available:', voiceService.getIsAvailable());
    console.log('🎤 IntroScreen: Is speaking:', isSpeaking);

    if (!voiceService.getIsAvailable() || isSpeaking) {
      console.log('⚠️ IntroScreen: Cannot start listening - not available or speaking');
      return;
    }

    try {
      console.log('🎤 IntroScreen: Starting voice listening...');
      await voiceService.startListening({
        onStart: () => {
          console.log('🎤 IntroScreen: Voice listening started');
          setIsListening(true);
          setRecognizedText('');
          setVoiceStatus('Listening for voice commands...');
        },
        onResult: handleVoiceResult,
        onError: (error) => {
          console.error('❌ IntroScreen: Voice recognition error:', error);
          setIsListening(false);
          setVoiceStatus(`Error: ${error}`);
        },
        onEnd: () => {
          console.log('🎤 IntroScreen: Voice listening ended');
          setIsListening(false);
          setVoiceStatus('Voice listening stopped');
        },
      });
    } catch (error) {
      console.error('❌ IntroScreen: Failed to start listening:', error);
      setVoiceStatus(`Failed to start: ${error}`);
    }
  };

  const handleVoiceResult = (result: VoiceRecognitionResult) => {
    console.log('Intro screen voice result:', result);
    setRecognizedText(result.originalText);

    if (result.command === 'start_brushing') {
      console.log('Handling start brushing command');
      handleStartBrushing();
    } else if (result.command === 'unknown') {
      console.log('Unknown command in intro, speaking retry message');
      speakRetryMessage();
    } else {
      console.log('Command not handled in intro:', result.command);
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

  // Simulate voice input for testing
  const simulateVoiceCommand = (command: string) => {
    console.log('🎤 IntroScreen: Simulating voice command:', command);
    console.log('🎤 IntroScreen: handleVoiceResult function available:', !!handleVoiceResult);

    // Ensure voice service is available
    voiceService.ensureAvailable();

    // Use force simulation to bypass listening checks
    voiceService.forceSimulateVoiceInput(command, {
      onResult: (result) => {
        console.log('🎤 IntroScreen: Simulation onResult called with:', result);
        handleVoiceResult(result);
      },
      onStart: () => {
        console.log('🎤 IntroScreen: Force simulation started');
        setIsListening(true);
      },
      onEnd: () => {
        console.log('🎤 IntroScreen: Force simulation ended');
        setIsListening(false);
      },
      onError: (error) => {
        console.error('🎤 IntroScreen: Force simulation error:', error);
        setIsListening(false);
      }
    });
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
          <Text style={styles.voiceStatusText}>{voiceStatus}</Text>
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

        {/* Debug buttons for testing */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Voice Command Test:</Text>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => simulateVoiceCommand('start brushing')}
          >
            <Text style={styles.debugButtonText}>Say "Start Brushing"</Text>
          </TouchableOpacity>
        </View>
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
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
  },
  voiceStatusText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
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
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    width: width - 40,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 10,
  },
  debugButton: {
    backgroundColor: '#FF5722',
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    minWidth: 150,
    alignItems: 'center',
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default IntroScreen;
