import { Alert, Linking, Platform } from 'react-native';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  message?: string;
}

class PermissionsService {
  /**
   * Check if microphone permission is granted
   */
  async checkMicrophonePermission(): Promise<PermissionStatus> {
    try {
      // In a real implementation, this would check actual microphone permissions
      // For now, we'll simulate permission checking
      return {
        granted: true,
        canAskAgain: true,
      };
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        message: 'Unable to check microphone permission',
      };
    }
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission(): Promise<PermissionStatus> {
    try {
      // In a real implementation, this would request actual microphone permissions
      // For now, we'll simulate permission request
      return {
        granted: true,
        canAskAgain: true,
      };
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        message: 'Failed to request microphone permission',
      };
    }
  }

  /**
   * Show permission denied alert with options
   */
  showPermissionDeniedAlert(): void {
    Alert.alert(
      'Microphone Permission Required',
      'Brush Buddy needs microphone access to hear your voice commands. You can still use the app by tapping the buttons.',
      [
        {
          text: 'Use Buttons Only',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: this.openAppSettings,
        },
      ]
    );
  }

  /**
   * Show permission permanently denied alert
   */
  showPermissionPermanentlyDeniedAlert(): void {
    Alert.alert(
      'Microphone Access Disabled',
      'Voice commands are disabled because microphone permission was denied. To enable voice commands, please go to your device settings and allow microphone access for Brush Buddy.',
      [
        {
          text: 'Continue Without Voice',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: this.openAppSettings,
        },
      ]
    );
  }

  /**
   * Open device settings for the app
   */
  openAppSettings = (): void => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  /**
   * Show voice recognition error alert
   */
  showVoiceRecognitionErrorAlert(error: string): void {
    Alert.alert(
      'Voice Recognition Error',
      `There was a problem with voice recognition: ${error}. You can continue using the buttons to navigate.`,
      [{ text: 'OK' }]
    );
  }

  /**
   * Show speech synthesis error alert
   */
  showSpeechSynthesisErrorAlert(error: string): void {
    Alert.alert(
      'Speech Error',
      `There was a problem with speech: ${error}. The app will continue to work normally.`,
      [{ text: 'OK' }]
    );
  }

  /**
   * Show general error alert
   */
  showGeneralErrorAlert(title: string, message: string): void {
    Alert.alert(title, message, [{ text: 'OK' }]);
  }

  /**
   * Handle voice service initialization errors
   */
  handleVoiceServiceError(error: any): void {
    console.error('Voice service error:', error);
    
    if (error.message?.includes('permission')) {
      this.showPermissionDeniedAlert();
    } else if (error.message?.includes('not supported')) {
      Alert.alert(
        'Voice Recognition Not Available',
        'Voice recognition is not supported on this device. You can still use the app by tapping the buttons.',
        [{ text: 'OK' }]
      );
    } else {
      this.showVoiceRecognitionErrorAlert(error.message || 'Unknown error');
    }
  }

  /**
   * Handle speech service errors
   */
  handleSpeechServiceError(error: any): void {
    console.error('Speech service error:', error);
    
    if (error.message?.includes('not supported')) {
      Alert.alert(
        'Text-to-Speech Not Available',
        'Text-to-speech is not supported on this device. You can still read the instructions on screen.',
        [{ text: 'OK' }]
      );
    } else {
      this.showSpeechSynthesisErrorAlert(error.message || 'Unknown error');
    }
  }

  /**
   * Check if device supports voice features
   */
  async checkDeviceCapabilities(): Promise<{
    speechSupported: boolean;
    voiceRecognitionSupported: boolean;
  }> {
    try {
      // In a real implementation, this would check actual device capabilities
      return {
        speechSupported: true,
        voiceRecognitionSupported: true,
      };
    } catch (error) {
      console.error('Error checking device capabilities:', error);
      return {
        speechSupported: false,
        voiceRecognitionSupported: false,
      };
    }
  }
}

// Export a singleton instance
export const permissionsService = new PermissionsService();
export default permissionsService;
