import { Alert } from 'react-native';

export type VoiceCommand = 'next' | 'done' | 'ready' | 'finish' | 'ok' | 'start_brushing' | 'start_over' | 'unknown';

export interface VoiceRecognitionResult {
  command: VoiceCommand;
  confidence: number;
  originalText: string;
}

export interface VoiceServiceCallbacks {
  onResult?: (result: VoiceRecognitionResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

class VoiceService {
  private isListening: boolean = false;
  private isAvailable: boolean = false;
  private callbacks: VoiceServiceCallbacks = {};

  // Valid voice commands that the app recognizes
  private readonly validCommands = {
    next: ['next', 'continue', 'go', 'proceed'],
    done: ['done', 'finished', 'complete', 'ready'],
    ready: ['ready', 'set', 'go ahead'],
    finish: ['finish', 'end', 'stop'],
    ok: ['ok', 'okay', 'yes', 'yeah'],
    start_brushing: ['start brushing', 'begin', 'start', 'let\'s go'],
    start_over: ['start over', 'restart', 'again', 'reset'],
  };

  /**
   * Initialize the voice service
   */
  async initialize(): Promise<boolean> {
    try {
      // For now, we'll simulate voice recognition availability
      // In a real implementation, this would check for microphone permissions
      // and voice recognition capabilities
      this.isAvailable = true;
      return true;
    } catch (error) {
      console.error('Voice service initialization failed:', error);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Start listening for voice commands
   */
  async startListening(callbacks: VoiceServiceCallbacks = {}): Promise<void> {
    if (!this.isAvailable) {
      const error = 'Voice recognition is not available on this device';
      callbacks.onError?.(error);
      return;
    }

    if (this.isListening) {
      return; // Already listening
    }

    try {
      this.callbacks = callbacks;
      this.isListening = true;
      this.callbacks.onStart?.();

      // For now, we'll simulate voice recognition
      // In a real implementation, this would start the actual voice recognition
      console.log('Voice recognition started (simulated)');
      
    } catch (error) {
      this.isListening = false;
      const errorMessage = `Failed to start voice recognition: ${error}`;
      console.error(errorMessage);
      this.callbacks.onError?.(errorMessage);
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    try {
      this.isListening = false;
      this.callbacks.onEnd?.();
      console.log('Voice recognition stopped');
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  /**
   * Process recognized text and extract commands
   */
  private processRecognizedText(text: string): VoiceRecognitionResult {
    const normalizedText = text.toLowerCase().trim();
    
    // Check each command category
    for (const [command, variations] of Object.entries(this.validCommands)) {
      for (const variation of variations) {
        if (normalizedText.includes(variation)) {
          return {
            command: command as VoiceCommand,
            confidence: 0.8, // Simulated confidence
            originalText: text,
          };
        }
      }
    }

    // No recognized command found
    return {
      command: 'unknown',
      confidence: 0.0,
      originalText: text,
    };
  }

  /**
   * Simulate voice input (for testing purposes)
   * In a real app, this would be replaced by actual voice recognition
   */
  simulateVoiceInput(text: string): void {
    if (!this.isListening) {
      return;
    }

    const result = this.processRecognizedText(text);
    this.callbacks.onResult?.(result);
  }

  /**
   * Check if voice recognition is currently active
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Check if voice recognition is available
   */
  getIsAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // In a real implementation, this would request microphone permissions
      // For now, we'll simulate permission granted
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      Alert.alert(
        'Microphone Permission Required',
        'Please enable microphone access in your device settings to use voice commands.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Get help text for voice commands
   */
  getVoiceCommandsHelp(): string {
    return `You can say these commands:
• "Next" or "Done" to continue
• "Ready" when you're prepared
• "Start Brushing" to begin
• "Start Over" to restart`;
  }
}

// Export a singleton instance
export const voiceService = new VoiceService();
export default voiceService;
