import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimerProps {
  isActive: boolean;
  onTick?: (seconds: number) => void;
  resetTrigger?: number; // Change this value to reset the timer
}

const Timer: React.FC<TimerProps> = ({ isActive, onTick, resetTrigger }) => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset timer when resetTrigger changes
  useEffect(() => {
    setSeconds(0);
  }, [resetTrigger]);

  // Handle timer start/stop
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prevSeconds => {
          const newSeconds = prevSeconds + 1;
          onTick?.(newSeconds);
          return newSeconds;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, onTick]);

  const formatTime = (totalSeconds: number): string => {
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    } else {
      const minutes = Math.floor(totalSeconds / 60);
      const remainingSeconds = totalSeconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timerText}>{formatTime(seconds)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E86AB',
    textAlign: 'center',
    fontFamily: 'System',
  },
});

export default Timer;
