import * as Speech from 'expo-speech';

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  language?: string;
  voice?: string;
}

class SpeechService {
  private isSpeaking: boolean = false;
  private currentSpeechId: string | null = null;

  /**
   * Speak the given text using Text-to-Speech
   */
  async speak(text: string, options: SpeechOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Stop any current speech
        this.stop();

        const speechOptions: Speech.SpeechOptions = {
          rate: options.rate || 0.8, // Slightly slower for children
          pitch: options.pitch || 1.1, // Slightly higher pitch for friendliness
          language: options.language || 'en-US',
          voice: options.voice,
          onStart: () => {
            this.isSpeaking = true;
          },
          onDone: () => {
            this.isSpeaking = false;
            this.currentSpeechId = null;
            resolve();
          },
          onStopped: () => {
            this.isSpeaking = false;
            this.currentSpeechId = null;
            resolve();
          },
          onError: (error) => {
            this.isSpeaking = false;
            this.currentSpeechId = null;
            reject(error);
          },
        };

        // Generate a unique ID for this speech
        this.currentSpeechId = Date.now().toString();
        
        Speech.speak(text, speechOptions);
      } catch (error) {
        this.isSpeaking = false;
        this.currentSpeechId = null;
        reject(error);
      }
    });
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.isSpeaking) {
      Speech.stop();
      this.isSpeaking = false;
      this.currentSpeechId = null;
    }
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Get available voices (if supported)
   */
  async getAvailableVoices(): Promise<Speech.Voice[]> {
    try {
      return await Speech.getAvailableVoicesAsync();
    } catch (error) {
      console.warn('Could not get available voices:', error);
      return [];
    }
  }

  /**
   * Check if speech is available on the device
   */
  async isSpeechAvailable(): Promise<boolean> {
    try {
      const voices = await this.getAvailableVoices();
      return voices.length > 0;
    } catch (error) {
      console.warn('Speech availability check failed:', error);
      return false;
    }
  }

  /**
   * Speak with kid-friendly voice settings
   */
  async speakForKids(text: string): Promise<void> {
    const kidFriendlyOptions: SpeechOptions = {
      rate: 0.75, // Slower rate for better comprehension
      pitch: 1.2, // Higher pitch for friendliness
      language: 'en-US',
    };

    return this.speak(text, kidFriendlyOptions);
  }
}

// Export a singleton instance
export const speechService = new SpeechService();
export default speechService;
