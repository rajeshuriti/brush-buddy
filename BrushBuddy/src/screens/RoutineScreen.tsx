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
  const [voiceStatus, setVoiceStatus] = useState<string>('Voice service ready');

  const currentStep = getStepById(currentStepId);
  const isLastStep = currentStepId === routineSteps.length - 1;

  useEffect(() => {
    // Initialize voice service when component mounts
    const initializeVoiceService = async () => {
      console.log('🎤 RoutineScreen: Initializing voice service...');
      try {
        await voiceService.initialize();
        // Ensure voice service is available for simulated mode
        voiceService.ensureAvailable();
        voiceService.logStatus();
        console.log('🎤 RoutineScreen: Voice service initialized and ensured available');

        // Start listening immediately after initialization
        console.log('🎤 RoutineScreen: Starting voice listening after initialization');
        setTimeout(() => {
          startListening();
        }, 1000);
      } catch (error) {
        console.error('🎤 RoutineScreen: Failed to initialize voice service:', error);
        // Force availability for simulated mode
        voiceService.ensureAvailable();
        console.log('🎤 RoutineScreen: Forced voice service availability for simulated mode');

        // Still try to start listening even after error
        setTimeout(() => {
          startListening();
        }, 1000);
      }
    };

    initializeVoiceService();
  }, []);

  useEffect(() => {
    if (currentStep) {
      speakCurrentStep();
    }
  }, [currentStepId]);

  const speakCurrentStep = useCallback(async () => {
    if (!currentStep) return;

    try {
      console.log('🎤 RoutineScreen: Starting to speak current step:', currentStep.title);
      setIsSpeaking(true);
      setTimerActive(false);
      voiceService.stopListening();

      await speechService.speakForKids(currentStep.dialogue);

      console.log('🎤 RoutineScreen: Finished speaking, resetting speaking state');
      setIsSpeaking(false);

      // Start timer if this step requires it
      if (currentStep.hasTimer && !currentStep.isConclusion) {
        setTimerActive(true);
        setTimerResetTrigger(prev => prev + 1);
      }

      // Start listening for voice commands
      if (!currentStep.isConclusion) {
        console.log('🎤 RoutineScreen: Starting voice listening after speech');
        setTimeout(startListening, 500);
      }
    } catch (error) {
      console.error('❌ RoutineScreen: Error speaking step:', error);
      console.log('🎤 RoutineScreen: Resetting speaking state due to error');
      setIsSpeaking(false);
      if (currentStep.hasTimer && !currentStep.isConclusion) {
        setTimerActive(true);
        setTimerResetTrigger(prev => prev + 1);
      }
      setTimeout(startListening, 500);
    }
  }, [currentStep]);

  const startListening = useCallback(async () => {
    console.log('🎤 RoutineScreen: startListening called');
    console.log('🎤 RoutineScreen: Voice available:', voiceService.getIsAvailable());
    console.log('🎤 RoutineScreen: Is speaking:', isSpeaking);
    console.log('🎤 RoutineScreen: Is conclusion:', currentStep?.isConclusion);

    // Always ensure voice service is available
    voiceService.ensureAvailable();
    voiceService.logStatus();

    // Don't start listening if on conclusion step
    if (currentStep?.isConclusion) {
      console.log('⚠️ RoutineScreen: Cannot start listening - conclusion step');
      return;
    }

    // Log speaking state but don't block (for debug purposes)
    if (isSpeaking) {
      console.log('⚠️ RoutineScreen: Currently speaking, but allowing voice commands for debug');
    }

    try {
      console.log('🎤 RoutineScreen: Starting voice listening...');
      await voiceService.startListening({
        onStart: () => {
          console.log('🎤 RoutineScreen: Voice listening started');
          setIsListening(true);
          setRecognizedText('');
          setVoiceStatus('Listening for voice commands...');
        },
        onResult: handleVoiceResult,
        onError: (error) => {
          console.error('❌ RoutineScreen: Voice recognition error:', error);
          setIsListening(false);
          setVoiceStatus(`Error: ${error}`);
          // Don't automatically restart on error - let manual commands handle it
          console.log('🎤 RoutineScreen: Voice error occurred, not auto-restarting');
        },
        onEnd: () => {
          console.log('🎤 RoutineScreen: Voice listening ended');
          setIsListening(false);
          setVoiceStatus('Ready for voice commands');
          // In simulated mode, we should stay listening - don't actually end
          console.log('🎤 RoutineScreen: Voice command processed, staying ready for next command');
        },
      });
    } catch (error) {
      console.error('❌ RoutineScreen: Failed to start listening:', error);
      setVoiceStatus(`Failed to start: ${error}`);
      // Don't automatically retry - let manual commands handle it
      console.log('🎤 RoutineScreen: Failed to start listening, not auto-retrying');
    }
  }, [isSpeaking, currentStep]);

  const handleVoiceResult = useCallback((result: VoiceRecognitionResult) => {
    console.log('🎤 RoutineScreen: handleVoiceResult called with:', result);
    console.log('🎤 RoutineScreen: Current step:', currentStep?.title);
    console.log('🎤 RoutineScreen: Current step ID:', currentStepId);

    setRecognizedText(result.originalText);

    const validCommands = ['next', 'done', 'ready', 'finish', 'ok'];

    console.log(`🎤 RoutineScreen: Command: ${result.command}, Is conclusion: ${currentStep?.isConclusion}, Valid commands: ${validCommands.includes(result.command)}`);

    if (currentStep?.isConclusion && result.command === 'start_over') {
      console.log('🎤 RoutineScreen: Handling start over command');
      handleStartOver();
    } else if (validCommands.includes(result.command)) {
      console.log('🎤 RoutineScreen: Handling next step command - calling handleNextStep()');
      handleNextStep();
    } else if (result.command === 'unknown') {
      console.log('🎤 RoutineScreen: Unknown command, speaking retry message');
      speakRetryMessage();
    } else {
      console.log('🎤 RoutineScreen: Command not handled:', result.command);
    }
  }, [currentStep, currentStepId]);

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
    console.log('🎤 RoutineScreen: handleNextStep called');
    console.log('🎤 RoutineScreen: Current step ID:', currentStepId);
    console.log('🎤 RoutineScreen: Is last step:', isLastStep);

    setTimerActive(false);
    voiceService.stopListening();
    speechService.stop();
    setRecognizedText('');

    if (isLastStep) {
      console.log('🎤 RoutineScreen: On last step, not advancing');
      // Stay on the last step (conclusion)
      return;
    }

    console.log('🎤 RoutineScreen: Advancing to next step:', currentStepId + 1);
    setCurrentStepId(prev => {
      const newStepId = prev + 1;
      console.log('🎤 RoutineScreen: Step ID updated to:', newStepId);
      return newStepId;
    });
  }, [isLastStep, currentStepId]);

  const handleStartOver = useCallback(() => {
    setTimerActive(false);
    voiceService.stopListening();
    speechService.stop();
    onStartOver();
  }, [onStartOver]);

  // Simulate voice input for testing
  const simulateVoiceCommand = (command: string) => {
    console.log('🎤 RoutineScreen: Simulating voice command:', command);
    console.log('🎤 RoutineScreen: Current step:', currentStep?.title);
    console.log('🎤 RoutineScreen: handleVoiceResult function available:', !!handleVoiceResult);
    console.log('🎤 RoutineScreen: Voice service listening state before:', voiceService.getIsListening());
    console.log('🎤 RoutineScreen: Is speaking before command:', isSpeaking);

    // Force reset speaking state for voice command testing
    if (isSpeaking) {
      console.log('🎤 RoutineScreen: Forcing speaking state reset for voice command');
      speechService.stop(); // Stop any ongoing speech
      setIsSpeaking(false);
    }

    // Ensure voice service is available and reset if stuck
    voiceService.ensureAvailable();

    // Check if voice service is stuck and reset if needed
    if (voiceService.isStuckInListeningState()) {
      console.log('🎤 RoutineScreen: Voice service appears stuck, forcing reset...');
      voiceService.forceResetListeningState();
    }

    // Use force simulation to bypass listening checks
    voiceService.forceSimulateVoiceInput(command, {
      onResult: (result) => {
        console.log('🎤 RoutineScreen: Simulation onResult called with:', result);
        handleVoiceResult(result);
      },
      onStart: () => {
        console.log('🎤 RoutineScreen: Force simulation started');
        setIsListening(true);
        setVoiceStatus('Processing voice command...');
      },
      onEnd: () => {
        console.log('🎤 RoutineScreen: Force simulation ended');
        // Keep listening state active for continuous voice commands
        setIsListening(true);
        setVoiceStatus('Listening for voice commands...');
        console.log('🎤 RoutineScreen: Voice command processed, staying ready for next command');
      },
      onError: (error) => {
        console.error('🎤 RoutineScreen: Force simulation error:', error);
        setIsListening(false);
        setVoiceStatus('Voice command error');
      }
    });
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
          <Text style={styles.voiceStatusText}>{voiceStatus}</Text>
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

        {/* Debug buttons for testing - Always visible for now */}
        {!currentStep.isConclusion && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Voice Command Test:</Text>
            <View style={styles.debugButtonRow}>
              <TouchableOpacity
                style={styles.debugButton}
                onPress={() => {
                  console.log('🎤 Debug: Testing "next" command');
                  simulateVoiceCommand('next');
                }}
              >
                <Text style={styles.debugButtonText}>Say "Next"</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.debugButton}
                onPress={() => {
                  console.log('🎤 Debug: Testing "done" command');
                  simulateVoiceCommand('done');
                }}
              >
                <Text style={styles.debugButtonText}>Say "Done"</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.debugButton}
                onPress={() => {
                  console.log('🎤 Debug: Testing "ready" command');
                  simulateVoiceCommand('ready');
                }}
              >
                <Text style={styles.debugButtonText}>Say "Ready"</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.debugButtonRow}>
              <TouchableOpacity
                style={[styles.debugButton, styles.directTestButton]}
                onPress={() => {
                  console.log('🎤 Direct test: Calling handleNextStep directly');
                  handleNextStep();
                }}
              >
                <Text style={styles.debugButtonText}>Direct Next Step</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.debugButton, styles.statusButton]}
                onPress={() => {
                  console.log('🎤 Status check: Voice service status');
                  voiceService.logStatus();
                  console.log('🎤 Status check: Current step:', currentStep?.title);
                  console.log('🎤 Status check: Step ID:', currentStepId);
                  console.log('🎤 Status check: Is listening:', isListening);
                  console.log('🎤 Status check: Is speaking:', isSpeaking);
                  console.log('🎤 Status check: Is stuck:', voiceService.isStuckInListeningState());
                }}
              >
                <Text style={styles.debugButtonText}>Check Status</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.debugButtonRow}>
              <TouchableOpacity
                style={[styles.debugButton, styles.resetButton]}
                onPress={() => {
                  console.log('🎤 Reset: Forcing voice service reset');
                  voiceService.forceResetListeningState();
                  setIsListening(false);
                  setVoiceStatus('Voice service reset');
                  console.log('🎤 Reset: Voice service has been reset');
                }}
              >
                <Text style={styles.debugButtonText}>Reset Voice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.debugButton, styles.startListeningButton]}
                onPress={() => {
                  console.log('🎤 Manual: Starting voice listening');
                  startListening();
                }}
              >
                <Text style={styles.debugButtonText}>Start Listening</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentStep.isConclusion && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Voice Command Test:</Text>
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => simulateVoiceCommand('start over')}
            >
              <Text style={styles.debugButtonText}>Say "Start Over"</Text>
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
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
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
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 10,
  },
  debugButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  debugButton: {
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    marginVertical: 3,
    minWidth: 80,
    alignItems: 'center',
  },
  directTestButton: {
    backgroundColor: '#4CAF50',
    minWidth: 120,
  },
  statusButton: {
    backgroundColor: '#2196F3',
    minWidth: 120,
  },
  resetButton: {
    backgroundColor: '#FF5722',
    minWidth: 120,
  },
  startListeningButton: {
    backgroundColor: '#4CAF50',
    minWidth: 120,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default RoutineScreen;
