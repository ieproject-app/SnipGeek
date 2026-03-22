"use client";

import { useCallback, useRef, useEffect } from 'react';

// We need to declare webkitAudioContext for Safari support
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

let audioContext: AudioContext | null = null;

const useSoundEffects = (enabled: boolean = true) => {
  // Use a ref so playSound always reads the latest enabled value
  // without needing to re-create callback functions on every toggle.
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    // A single user interaction is required to unlock the audio context.
    const initAudioContext = () => {
      if (window.AudioContext || window.webkitAudioContext) {
        if (!audioContext) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
      }
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('touchend', initAudioContext);
    };

    document.addEventListener('click', initAudioContext);
    document.addEventListener('touchend', initAudioContext);

    return () => {
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('touchend', initAudioContext);
    };
  }, []);

  const playSound = useCallback((type: 'tick' | 'winner' | 'error') => {
    if (!enabledRef.current || !audioContext) return;
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

    if (type === 'tick') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'winner') {
      const now = audioContext.currentTime;
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(523.25, now);   // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
      oscillator.frequency.setValueAtTime(1046.50, now + 0.3); // C6
      gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.4);
      oscillator.start(now);
      oscillator.stop(now + 0.4);
    } else if (type === 'error') {
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  }, []); // stable — reads enabled state via ref, not closure

  const playTick = useCallback(() => playSound('tick'), [playSound]);
  const playCountdownTick = useCallback(() => playSound('tick'), [playSound]);
  const playWinner = useCallback(() => playSound('winner'), [playSound]);
  const playError = useCallback(() => playSound('error'), [playSound]);

  return { playTick, playCountdownTick, playWinner, playError };
};

export default useSoundEffects;
