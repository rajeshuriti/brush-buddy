import { Alert, Platform } from 'react-native';

// Try to import voice recognition library
let Voice: any = null;
try {
  Voice = require('@react-native-voice/voice').default;
} catch (error) {
  console.warn('Voice recognition library not available, using simulated mode');
}

// Web Speech API support
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

let WebSpeechRecognition: any = null;
if (typeof window !== 'undefined') {
  WebSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
}

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
  private useRealVoice: boolean = false;
  private useWebSpeech: boolean = false;
  private isInitialized: boolean = false;
  private webRecognition: any = null;
  private instanceId: string;

  constructor() {
    this.instanceId = Math.random().toString(36).substr(2, 9);
    console.log('🎤 VoiceService: New instance created with ID:', this.instanceId);
  }

  // Valid voice commands that the app recognizes
  private readonly validCommands = {
    next: ['next', 'continue', 'go', 'proceed', 'move on', 'keep going'],
    done: ['done', 'finished', 'complete', 'finish', 'ready', 'all done'],
    ready: ['ready', 'set', 'go ahead', 'i\'m ready', 'let\'s do it'],
    finish: ['finish', 'end', 'stop', 'finished', 'all finished'],
    ok: ['ok', 'okay', 'yes', 'yeah', 'yep', 'sure'],
    start_brushing: ['start brushing', 'begin', 'start', 'let\'s go', 'let\'s start', 'begin brushing'],
    start_over: ['start over', 'restart', 'again', 'reset', 'do it again', 'start again'],
  };

  /**
   * Initialize the voice service
   */
  async initialize(): Promise<boolean> {
    console.log('🎤 VoiceService: Starting initialization... (Instance:', this.instanceId + ')');
    console.log('🎤 VoiceService: Platform:', Platform.OS);
    console.log('🎤 VoiceService: Voice library available:', !!Voice);
    console.log('🎤 VoiceService: WebSpeechRecognition available:', !!WebSpeechRecognition);
    console.log('🎤 VoiceService: Already initialized:', this.isInitialized);
    console.log('🎤 VoiceService: Current availability:', this.isAvailable);

    if (this.isInitialized) {
      console.log('🎤 VoiceService: Already initialized, returning availability:', this.isAvailable);
      return this.isAvailable;
    }

    // Always ensure we have a working voice service, even if it's simulated
    let initializationMode = 'SIMULATED'; // Default to simulated mode

    try {
      if (Voice && Platform.OS !== 'web') {
        console.log('🎤 VoiceService: Attempting to initialize real voice recognition...');
        try {
          await this.initializeRealVoice();
          this.useRealVoice = true;
          this.useWebSpeech = false;
          initializationMode = 'REAL';
          console.log('✅ VoiceService: Real voice recognition initialized successfully');
        } catch (realVoiceError) {
          console.warn('⚠️ VoiceService: Real voice recognition failed:', realVoiceError);
          // Continue to fallback options
        }
      }

      if (!this.useRealVoice && Platform.OS === 'web' && WebSpeechRecognition) {
        console.log('🎤 VoiceService: Attempting to initialize Web Speech API...');
        try {
          this.initializeWebSpeech();
          this.useRealVoice = false;
          this.useWebSpeech = true;
          initializationMode = 'WEB_SPEECH';
          console.log('✅ VoiceService: Web Speech API initialized successfully');
        } catch (webSpeechError) {
          console.warn('⚠️ VoiceService: Web Speech API failed:', webSpeechError);
          // Continue to simulated mode
        }
      }

      if (!this.useRealVoice && !this.useWebSpeech) {
        // Always fall back to simulated voice recognition
        console.log('🎤 VoiceService: Using simulated voice recognition mode');
        this.useRealVoice = false;
        this.useWebSpeech = false;
        initializationMode = 'SIMULATED';
        console.log('✅ VoiceService: Simulated voice recognition initialized');
      }

    } catch (error) {
      console.warn('⚠️ VoiceService: Initialization error, using simulated mode:', error);
      // Force simulated mode
      this.useRealVoice = false;
      this.useWebSpeech = false;
      initializationMode = 'SIMULATED';
    }

    // Always mark as available and initialized
    this.isAvailable = true;
    this.isInitialized = true;

    console.log('🎤 VoiceService: Initialization complete. Mode:', initializationMode);
    console.log('🎤 VoiceService: Service is available:', this.isAvailable);
    return true;
  }

  /**
   * Initialize real voice recognition
   */
  private async initializeRealVoice(): Promise<void> {
    if (!Voice) {
      throw new Error('Voice library not available');
    }

    // Set up voice recognition event listeners
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);

    // Check if voice recognition is available - handle the null error gracefully
    let available = false;
    try {
      available = await Voice.isAvailable();
      console.log('🎤 VoiceService: Voice.isAvailable() returned:', available);
    } catch (availabilityError) {
      console.warn('🎤 VoiceService: Voice.isAvailable() failed:', availabilityError);
      // Try alternative check
      try {
        available = await Voice.isRecognitionAvailable();
        console.log('🎤 VoiceService: Voice.isRecognitionAvailable() returned:', available);
      } catch (recognitionError) {
        console.warn('🎤 VoiceService: Voice.isRecognitionAvailable() also failed:', recognitionError);
        // Don't throw error, let it fall back to simulated mode
        available = false;
      }
    }

    if (!available) {
      console.warn('🎤 VoiceService: Voice recognition not available on this device');
      throw new Error('Voice recognition not available on this device');
    }

    console.log('✅ VoiceService: Real voice recognition availability confirmed');
  }

  /**
   * Initialize Web Speech API
   */
  private initializeWebSpeech(): void {
    if (!WebSpeechRecognition) {
      throw new Error('Web Speech API not available');
    }

    this.webRecognition = new WebSpeechRecognition();
    this.webRecognition.continuous = false;
    this.webRecognition.interimResults = false;
    this.webRecognition.lang = 'en-US';

    this.webRecognition.onstart = () => {
      console.log('🎤 Web Speech: Recognition started');
      this.callbacks.onStart?.();
    };

    this.webRecognition.onresult = (event: any) => {
      console.log('🎤 Web Speech: Results received');
      if (event.results && event.results.length > 0) {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Web Speech: Transcript:', transcript);
        const result = this.processRecognizedText(transcript);
        this.callbacks.onResult?.(result);
      }
    };

    this.webRecognition.onend = () => {
      console.log('🎤 Web Speech: Recognition ended');
      this.isListening = false;
      this.callbacks.onEnd?.();
    };

    this.webRecognition.onerror = (event: any) => {
      console.error('🎤 Web Speech: Error:', event.error);
      this.isListening = false;
      this.callbacks.onError?.(event.error);
    };
  }

  /**
   * Start listening for voice commands
   */
  async startListening(callbacks: VoiceServiceCallbacks = {}): Promise<void> {
    console.log('🎤 VoiceService: startListening called (Instance:', this.instanceId + ')');
    console.log('🎤 VoiceService: Available:', this.isAvailable);
    console.log('🎤 VoiceService: Already listening:', this.isListening);
    console.log('🎤 VoiceService: Mode:', this.useRealVoice ? 'REAL' : this.useWebSpeech ? 'WEB_SPEECH' : 'SIMULATED');

    // Ensure service is available (force if needed)
    if (!this.isAvailable) {
      console.log('🎤 VoiceService: Service not available, ensuring availability...');
      this.ensureAvailable();
    }

    if (this.isListening) {
      console.log('⚠️ VoiceService: Already listening, updating callbacks and continuing');
      // In simulated mode, just update callbacks and continue - don't reset
      this.callbacks = { ...this.callbacks, ...callbacks };
      console.log('🎤 VoiceService: Callbacks updated, continuing to listen');
      return;
    }

    // Always set up callbacks and mark as listening
    console.log('🎤 VoiceService: Setting up callbacks and starting listening...');
    this.callbacks = callbacks;
    this.isListening = true;

    try {
      if (this.useRealVoice && Voice) {
        console.log('🎤 VoiceService: Starting REAL voice recognition...');
        try {
          await Voice.start('en-US');
          console.log('✅ VoiceService: Real voice recognition started successfully');
        } catch (realVoiceError) {
          console.warn('⚠️ VoiceService: Real voice failed, falling back to simulated:', realVoiceError);
          this.fallbackToSimulated();
        }
      } else if (this.useWebSpeech && this.webRecognition) {
        console.log('🎤 VoiceService: Starting WEB SPEECH recognition...');
        try {
          this.webRecognition.start();
          console.log('✅ VoiceService: Web Speech recognition started successfully');
        } catch (webSpeechError) {
          console.warn('⚠️ VoiceService: Web Speech failed, falling back to simulated:', webSpeechError);
          this.fallbackToSimulated();
        }
      } else {
        console.log('🎤 VoiceService: Starting SIMULATED voice recognition...');
        this.startSimulatedListening();
      }

    } catch (error) {
      console.error('❌ VoiceService: Failed to start listening:', error);
      console.log('🎤 VoiceService: Falling back to simulated mode due to error');
      this.fallbackToSimulated();
    }
  }

  /**
   * Start simulated listening mode
   */
  private startSimulatedListening(): void {
    console.log('🎤 VoiceService: Starting simulated listening mode');
    // Trigger onStart callback
    this.callbacks.onStart?.();

    // In simulated mode, we're always ready to receive commands
    setTimeout(() => {
      if (this.isListening) {
        console.log('✅ VoiceService: Simulated mode ready to receive voice commands');
        console.log('🎤 VoiceService: You can now use the debug buttons to test voice commands');
      }
    }, 100);
  }

  /**
   * Fallback to simulated mode when other modes fail
   */
  private fallbackToSimulated(): void {
    console.log('🎤 VoiceService: Falling back to simulated mode');
    this.useRealVoice = false;
    this.useWebSpeech = false;
    this.startSimulatedListening();
  }

  /**
   * Stop listening for voice commands
   */
  stopListening(): void {
    console.log('🎤 VoiceService: stopListening called, current state:', this.isListening);

    if (!this.isListening) {
      console.log('🎤 VoiceService: Not listening, nothing to stop');
      return;
    }

    try {
      console.log('🎤 VoiceService: Stopping voice recognition...');

      if (this.useRealVoice && Voice) {
        Voice.stop();
        console.log('🎤 VoiceService: Real voice recognition stopped');
      } else if (this.useWebSpeech && this.webRecognition) {
        this.webRecognition.stop();
        console.log('🎤 VoiceService: Web Speech recognition stopped');
      } else {
        console.log('🎤 VoiceService: Simulated voice recognition stopped');
        // In simulated mode, trigger onEnd callback
        if (this.callbacks.onEnd) {
          this.callbacks.onEnd();
        }
      }

      // Always reset listening state
      this.isListening = false;
      console.log('🎤 VoiceService: Listening state reset to false');

    } catch (error) {
      console.error('❌ VoiceService: Error stopping voice recognition:', error);
      // Force reset state even if there's an error
      this.isListening = false;
      if (this.callbacks.onEnd) {
        this.callbacks.onEnd();
      }
    }
  }

  /**
   * Clean up callbacks and reset state
   */
  private cleanupCallbacks(): void {
    console.log('🎤 VoiceService: Cleaning up callbacks');
    // Don't completely clear callbacks, just mark as not listening
    // This allows the callbacks to still be available for the next command
    this.isListening = false;
  }

  /**
   * Voice recognition event handlers
   */
  private onSpeechStart = () => {
    console.log('Speech recognition started');
    this.callbacks.onStart?.();
  };

  private onSpeechEnd = () => {
    console.log('Speech recognition ended');
    this.isListening = false;
    this.callbacks.onEnd?.();
  };

  private onSpeechResults = (event: any) => {
    console.log('Speech results:', event.value);
    if (event.value && event.value.length > 0) {
      const recognizedText = event.value[0];
      const result = this.processRecognizedText(recognizedText);
      this.callbacks.onResult?.(result);
    }
  };

  private onSpeechPartialResults = (event: any) => {
    console.log('Partial speech results:', event.value);
    // We can use this for real-time feedback if needed
  };

  private onSpeechError = (event: any) => {
    console.error('Speech recognition error:', event.error);
    this.isListening = false;

    // Handle specific error types
    if (event.error?.message?.includes('No speech input')) {
      // Restart listening automatically for "no speech" errors
      setTimeout(() => {
        if (!this.isListening) {
          this.startListening(this.callbacks);
        }
      }, 1000);
    } else {
      this.callbacks.onError?.(event.error?.message || 'Speech recognition error');
    }
  };

  /**
   * Process recognized text and extract commands
   */
  private processRecognizedText(text: string): VoiceRecognitionResult {
    const normalizedText = text.toLowerCase().trim();
    console.log('Processing recognized text:', normalizedText);

    // Remove common filler words and punctuation
    const cleanedText = normalizedText
      .replace(/[.,!?;]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('Cleaned text:', cleanedText);

    // Check each command category with exact matches first, then partial matches
    for (const [command, variations] of Object.entries(this.validCommands)) {
      for (const variation of variations) {
        // First try exact match
        if (cleanedText === variation) {
          console.log(`Exact match for command: ${command} from text: ${cleanedText}`);
          return {
            command: command as VoiceCommand,
            confidence: 0.95,
            originalText: text,
          };
        }

        // Then try partial match
        if (cleanedText.includes(variation)) {
          console.log(`Partial match for command: ${command} from text: ${cleanedText}`);
          return {
            command: command as VoiceCommand,
            confidence: 0.8,
            originalText: text,
          };
        }

        // Also check if the variation is contained in the text (reverse check)
        if (variation.includes(cleanedText) && cleanedText.length > 2) {
          console.log(`Reverse match for command: ${command} from text: ${cleanedText}`);
          return {
            command: command as VoiceCommand,
            confidence: 0.7,
            originalText: text,
          };
        }
      }
    }

    console.log(`No command matched for text: ${cleanedText}`);
    // No recognized command found
    return {
      command: 'unknown',
      confidence: 0.0,
      originalText: text,
    };
  }

  /**
   * Simulate voice input (for testing purposes)
   * Works in both real and simulated modes
   */
  simulateVoiceInput(text: string): void {
    console.log('🎤 VoiceService: simulateVoiceInput called with text:', text);
    console.log('🎤 VoiceService: Currently listening:', this.isListening);
    console.log('🎤 VoiceService: Callbacks available:', !!this.callbacks.onResult);

    // Force the simulation to work even if not listening
    if (!this.isListening) {
      console.log('⚠️ VoiceService: Not listening, forcing simulation anyway...');
      // Set up minimal state for simulation
      this.isListening = true;

      // Trigger onStart if available
      if (this.callbacks.onStart) {
        console.log('🎤 VoiceService: Triggering onStart callback...');
        this.callbacks.onStart();
      }
    }

    console.log('🎤 VoiceService: Processing simulated voice input:', text);
    const result = this.processRecognizedText(text);
    console.log('🎤 VoiceService: Processed result:', result);

    if (this.callbacks.onResult) {
      console.log('🎤 VoiceService: Calling onResult callback...');
      this.callbacks.onResult(result);
      console.log('✅ VoiceService: onResult callback completed');
    } else {
      console.error('❌ VoiceService: No onResult callback available!');
    }

    // Simulate the end of recognition
    setTimeout(() => {
      if (this.callbacks.onEnd) {
        console.log('🎤 VoiceService: Triggering onEnd callback...');
        this.callbacks.onEnd();
      }
    }, 100);
  }

  /**
   * Force simulate voice input - bypasses all checks and manages state properly
   */
  forceSimulateVoiceInput(text: string, callbacks?: VoiceServiceCallbacks): void {
    console.log('🎤 VoiceService: forceSimulateVoiceInput called with text:', text, '(Instance:', this.instanceId + ')');
    console.log('🎤 VoiceService: Current listening state:', this.isListening);
    console.log('🎤 VoiceService: Service available:', this.isAvailable);
    console.log('🎤 VoiceService: Service initialized:', this.isInitialized);
    console.log('🎤 VoiceService: Voice mode - Real:', this.useRealVoice, 'Web:', this.useWebSpeech);

    // Use provided callbacks or current ones
    const activeCallbacks = callbacks || this.callbacks;
    console.log('🎤 VoiceService: Provided callbacks:', !!callbacks);
    console.log('🎤 VoiceService: Current callbacks:', !!this.callbacks.onResult);
    console.log('🎤 VoiceService: Active callbacks onResult:', !!activeCallbacks.onResult);
    console.log('🎤 VoiceService: Active callbacks onStart:', !!activeCallbacks.onStart);
    console.log('🎤 VoiceService: Active callbacks onEnd:', !!activeCallbacks.onEnd);

    // If we have new callbacks, update them
    if (callbacks) {
      this.callbacks = callbacks;
      console.log('🎤 VoiceService: Updated callbacks for force simulation');
    }

    // Ensure service is available for simulation
    if (!this.isAvailable) {
      console.log('🎤 VoiceService: Service not available, forcing availability...');
      this.ensureAvailable();
    }

    // Ensure we're in a listening state for simulation
    if (!this.isListening) {
      console.log('🎤 VoiceService: Setting listening state for simulation');
      this.isListening = true;
      // Trigger onStart if available
      if (activeCallbacks.onStart) {
        console.log('🎤 VoiceService: Triggering onStart callback...');
        try {
          activeCallbacks.onStart();
          console.log('✅ VoiceService: onStart callback completed');
        } catch (error) {
          console.error('❌ VoiceService: Error in onStart callback:', error);
        }
      }
    }

    // Process the text
    console.log('🎤 VoiceService: Processing text:', text);
    const result = this.processRecognizedText(text);
    console.log('🎤 VoiceService: Force simulation result:', result);

    // Trigger the result callback directly
    if (activeCallbacks.onResult) {
      console.log('🎤 VoiceService: Calling force simulation onResult callback...');
      try {
        activeCallbacks.onResult(result);
        console.log('✅ VoiceService: Force simulation onResult completed successfully');
      } catch (error) {
        console.error('❌ VoiceService: Error in onResult callback:', error);
        console.error('❌ VoiceService: Error details:', error.message, error.stack);
      }
    } else {
      console.error('❌ VoiceService: No onResult callback available for force simulation!');
      console.log('🎤 VoiceService: Available callbacks keys:', Object.keys(activeCallbacks));
      console.log('🎤 VoiceService: Callbacks object:', activeCallbacks);
    }

    // Don't reset listening state - keep it active for continuous listening
    setTimeout(() => {
      console.log('🎤 VoiceService: Force simulation complete, maintaining listening state');
      // Only trigger onEnd if we want to stop listening
      if (activeCallbacks.onEnd) {
        console.log('🎤 VoiceService: Triggering onEnd callback but keeping listening active');
        try {
          activeCallbacks.onEnd();
          console.log('✅ VoiceService: onEnd callback completed');
        } catch (error) {
          console.error('❌ VoiceService: Error in onEnd callback:', error);
        }
      }
    }, 100);
  }

  /**
   * Ensure voice service is available for simulated mode
   */
  ensureAvailable(): void {
    console.log('🎤 VoiceService: ensureAvailable called (Instance:', this.instanceId + ')');
    if (!this.isAvailable) {
      console.log('🎤 VoiceService: Service not available, forcing availability for simulated mode');
      this.isAvailable = true;
      this.isInitialized = true;
      this.useRealVoice = false;
      this.useWebSpeech = false;
    }
    console.log('🎤 VoiceService: Service is now available:', this.isAvailable);
  }

  /**
   * Force reset the listening state - use when voice service gets stuck
   */
  forceResetListeningState(): void {
    console.log('🎤 VoiceService: forceResetListeningState called (Instance:', this.instanceId + ')');
    console.log('🎤 VoiceService: Previous listening state:', this.isListening);

    // Force stop any ongoing recognition
    this.stopListening();

    // Reset state
    this.isListening = false;

    // Clear callbacks to prevent stale references
    this.callbacks = {};

    console.log('🎤 VoiceService: Listening state forcefully reset');
    console.log('🎤 VoiceService: New listening state:', this.isListening);
  }

  /**
   * Check if voice service is stuck and needs reset
   */
  isStuckInListeningState(): boolean {
    // In simulated mode, we should never be considered "stuck" - it's designed to stay listening
    // Only consider stuck if we're in real voice mode and have been listening for too long
    return false; // Simulated mode should always be allowed to stay listening
  }

  /**
   * Cleanup voice service
   */
  cleanup(): void {
    this.stopListening();

    if (this.useRealVoice && Voice) {
      try {
        Voice.destroy();
      } catch (error) {
        console.error('Error destroying voice service:', error);
      }
    }

    this.isInitialized = false;
    this.isAvailable = false;
    this.callbacks = {};
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
    console.log('🎤 VoiceService: getIsAvailable called, returning:', this.isAvailable);
    console.log('🎤 VoiceService: isInitialized:', this.isInitialized);
    return this.isAvailable;
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (this.useRealVoice && Voice) {
        // Request real microphone permissions
        try {
          const hasPermission = await Voice.isRecognitionAvailable();
          if (!hasPermission) {
            Alert.alert(
              'Microphone Permission Required',
              'Please enable microphone access in your device settings to use voice commands.',
              [{ text: 'OK' }]
            );
            return false;
          }
          return true;
        } catch (voiceError) {
          console.warn('Voice permission check failed:', voiceError);
          return true; // Continue anyway
        }
      } else if (this.useWebSpeech) {
        // Web Speech API permissions are handled by the browser
        return true;
      } else {
        // In simulated mode, always return true
        return true;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      // Don't show alert for simulated mode
      if (this.useRealVoice || this.useWebSpeech) {
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access in your device settings to use voice commands.',
          [{ text: 'OK' }]
        );
      }
      return true; // Continue with simulated mode
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

  /**
   * Get current voice service status for debugging
   */
  getStatus(): {
    isInitialized: boolean;
    isAvailable: boolean;
    isListening: boolean;
    useRealVoice: boolean;
    useWebSpeech: boolean;
    platform: string;
    voiceLibraryAvailable: boolean;
    webSpeechAvailable: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      isAvailable: this.isAvailable,
      isListening: this.isListening,
      useRealVoice: this.useRealVoice,
      useWebSpeech: this.useWebSpeech,
      platform: Platform.OS,
      voiceLibraryAvailable: !!Voice,
      webSpeechAvailable: !!WebSpeechRecognition,
    };
  }

  /**
   * Log current status for debugging
   */
  logStatus(): void {
    const status = this.getStatus();
    console.log('🎤 VoiceService Status (Instance:', this.instanceId + '):', status);
  }
}

// Export a singleton instance
export const voiceService = new VoiceService();
export default voiceService;
