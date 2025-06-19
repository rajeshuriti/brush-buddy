import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import Timer from '../components/Timer';
import speechService from '../services/speechService';
import voiceService, { VoiceRecognitionResult } from '../services/voiceService';
import { routineSteps, getStepById } from '../data/routineSteps';

interface RoutineScreenProps {
  onStartOver: () => void;
}

const RoutineScreen: React.FC<RoutineScreenProps> = ({ onStartOver }) => {
  const [currentStepId, setCurrentStepId] = useState(1); // Start with first actual step (not intro)
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerResetTrigger, setTimerResetTrigger] = useState(0);

  const currentStep = getStepById(currentStepId);
  const isLastStep = currentStepId === routineSteps.length - 1;

  useEffect(() => {
    if (currentStep) {
      speakCurrentStep();
    }
  }, [currentStepId]);

  const speakCurrentStep = useCallback(async () => {
    if (!currentStep) return;

    try {
      setIsSpeaking(true);
      setTimerActive(false);
      voiceService.stopListening();

      await speechService.speakForKids(currentStep.dialogue);
      
      setIsSpeaking(false);

      // Start timer if this step requires it
      if (currentStep.hasTimer && !currentStep.isConclusion) {
        setTimerActive(true);
        setTimerResetTrigger(prev => prev + 1);
      }

      // Start listening for voice commands
      if (!currentStep.isConclusion) {
        setTimeout(startListening, 500);
      }
    } catch (error) {
      console.error('Error speaking step:', error);
      setIsSpeaking(false);
      if (currentStep.hasTimer && !currentStep.isConclusion) {
        setTimerActive(true);
        setTimerResetTrigger(prev => prev + 1);
      }
      setTimeout(startListening, 500);
    }
  }, [currentStep]);

  const startListening = useCallback(async () => {
    if (!voiceService.getIsAvailable() || isSpeaking || currentStep?.isConclusion) {
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
          // Restart listening after a short delay
          setTimeout(startListening, 2000);
        },
        onEnd: () => {
          setIsListening(false);
          // Restart listening if not on conclusion step
          if (!currentStep?.isConclusion) {
            setTimeout(startListening, 1000);
          }
        },
      });
    } catch (error) {
      console.error('Failed to start listening:', error);
    }
  }, [isSpeaking, currentStep]);

  const handleVoiceResult = useCallback((result: VoiceRecognitionResult) => {
    setRecognizedText(result.originalText);

    const validCommands = ['next', 'done', 'ready', 'finish', 'ok'];
    
    if (currentStep?.isConclusion && result.command === 'start_over') {
      handleStartOver();
    } else if (validCommands.includes(result.command)) {
      handleNextStep();
    } else if (result.command === 'unknown') {
      speakRetryMessage();
    }
  }, [currentStep]);

  const speakRetryMessage = useCallback(async () => {
    try {
      setIsSpeaking(true);
      setTimerActive(false);
      voiceService.stopListening();
      
      await speechService.speakForKids("Didn't quite get that. Please say 'Next' or 'Done'.");
      
      setIsSpeaking(false);
      
      if (currentStep?.hasTimer && !currentStep.isConclusion) {
        setTimerActive(true);
      }
      
      setTimeout(startListening, 500);
    } catch (error) {
      console.error('Error speaking retry message:', error);
      setIsSpeaking(false);
      if (currentStep?.hasTimer && !currentStep.isConclusion) {
        setTimerActive(true);
      }
      setTimeout(startListening, 500);
    }
  }, [currentStep, startListening]);

  const handleNextStep = useCallback(() => {
    setTimerActive(false);
    voiceService.stopListening();
    speechService.stop();
    setRecognizedText('');

    if (isLastStep) {
      // Stay on the last step (conclusion)
      return;
    }

    setCurrentStepId(prev => prev + 1);
  }, [isLastStep]);

  const handleStartOver = useCallback(() => {
    setTimerActive(false);
    voiceService.stopListening();
    speechService.stop();
    onStartOver();
  }, [onStartOver]);

  // Simulate voice input for testing
  const simulateVoiceCommand = (command: string) => {
    voiceService.simulateVoiceInput(command);
  };

  if (!currentStep) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Step not found!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Step Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Step {currentStepId} of {routineSteps.length - 1}
          </Text>
        </View>

        {/* Step Title */}
        <Text style={styles.stepTitle}>{currentStep.title}</Text>

        {/* Main Dialogue */}
        <View style={styles.dialogueContainer}>
          <Text style={styles.dialogueText}>{currentStep.dialogue}</Text>
        </View>

        {/* Timer (only show if step has timer and is active) */}
        {currentStep.hasTimer && !currentStep.isConclusion && (
          <View style={styles.timerContainer}>
            <Timer
              isActive={timerActive}
              resetTrigger={timerResetTrigger}
            />
          </View>
        )}

        {/* Voice Status */}
        <View style={styles.voiceStatusContainer}>
          {isSpeaking && (
            <Text style={styles.speakingText}>🗣️ Speaking...</Text>
          )}
          {isListening && !isSpeaking && (
            <Text style={styles.listeningText}>🎤 Listening...</Text>
          )}
          {recognizedText && !isSpeaking && (
            <Text style={styles.recognizedText}>Heard: "{recognizedText}"</Text>
          )}
        </View>

        {/* User Prompt */}
        <Text style={styles.promptText}>{currentStep.prompt}</Text>
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {currentStep.isConclusion ? (
          <TouchableOpacity
            style={styles.startOverButton}
            onPress={handleStartOver}
          >
            <Text style={styles.startOverButtonText}>Start Over 🔄</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, isSpeaking && styles.disabledButton]}
            onPress={handleNextStep}
            disabled={isSpeaking}
          >
            <Text style={styles.nextButtonText}>Next Step! ➡️</Text>
          </TouchableOpacity>
        )}

        {/* Debug buttons for testing */}
        {__DEV__ && !currentStep.isConclusion && (
          <View style={styles.debugContainer}>
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => simulateVoiceCommand('next')}
            >
              <Text style={styles.debugButtonText}>Test: "Next"</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => simulateVoiceCommand('done')}
            >
              <Text style={styles.debugButtonText}>Test: "Done"</Text>
            </TouchableOpacity>
          </View>
        )}

        {__DEV__ && currentStep.isConclusion && (
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => simulateVoiceCommand('start over')}
          >
            <Text style={styles.debugButtonText}>Test: "Start Over"</Text>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E86AB',
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogueContainer: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  dialogueText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
  },
  voiceStatusContainer: {
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  speakingText: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: '600',
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
  promptText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  bottomControls: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startOverButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  startOverButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 50,
  },
  debugContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  debugButton: {
    backgroundColor: '#FF5722',
    padding: 8,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
  },
});

export default RoutineScreen;
