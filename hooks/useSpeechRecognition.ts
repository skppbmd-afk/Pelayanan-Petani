import { useState, useEffect, useRef } from 'react';

// Check for the API availability once at the module level.
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any | null>(null);

  // This effect sets up the speech recognition instance and its event listeners.
  // It runs only once when the component mounts.
  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      console.warn("Speech recognition is not supported by this browser.");
      return; // Do nothing if the browser doesn't support the API.
    }

    // Create the instance safely inside the effect.
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.lang = 'id-ID';
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    // Event handler for results
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interimTranscript);
    };

    // Event handler for when listening ends
    recognition.onend = () => {
      setIsListening(false);
    };

    // Event handler for errors
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    // Cleanup function: this is crucial to prevent memory leaks.
    // It runs when the component unmounts.
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
      }
    };
  }, []); // The empty dependency array ensures this effect runs only once.

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error starting speech recognition:", err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false); // Proactively set state, though onend will also fire.
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport: !!SpeechRecognitionAPI
  };
};
