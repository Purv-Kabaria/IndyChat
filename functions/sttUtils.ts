"use client";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const isSpeechRecognitionSupported = (): boolean => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

export type RecognitionResultCallback = (transcript: string, isFinal: boolean) => void;
export type RecognitionErrorCallback = (error: any) => void;
export type RecognitionStateChangeCallback = (isListening: boolean) => void;

export class SpeechRecognitionHandler {
  private recognition: any;
  private isListening: boolean = false;
  private onResultCallback: RecognitionResultCallback;
  private onErrorCallback: RecognitionErrorCallback;
  private onStateChangeCallback: RecognitionStateChangeCallback;

  constructor(
    onResult: RecognitionResultCallback,
    onError: RecognitionErrorCallback,
    onStateChange: RecognitionStateChangeCallback
  ) {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onStateChangeCallback = onStateChange;

    if (isSpeechRecognitionSupported()) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = this.handleResult.bind(this);
      this.recognition.onerror = this.handleError.bind(this);
      this.recognition.onend = this.handleEnd.bind(this);
    } else {
      console.error('Speech recognition is not supported in this browser');
    }
  }

  private handleResult(event: any) {
    const resultIndex = event.resultIndex;
    const transcript = event.results[resultIndex][0].transcript;
    const isFinal = event.results[resultIndex].isFinal;
    
    this.onResultCallback(transcript, isFinal);
  }

  private handleError(event: any) {
    console.error('Speech recognition error:', event.error);
    this.onErrorCallback(event.error);
    this.isListening = false;
    this.onStateChangeCallback(false);
  }

  private handleEnd() {
    if (this.isListening) {
      this.isListening = false;
      this.onStateChangeCallback(false);
    }
  }

  public start() {
    if (!this.recognition) {
      this.onErrorCallback('Speech recognition is not supported in this browser');
      return;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      this.onStateChangeCallback(true);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.onErrorCallback(error);
    }
  }

  public stop() {
    if (!this.recognition || !this.isListening) return;

    try {
      this.isListening = false;
      this.onStateChangeCallback(false);
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }

  public isActive(): boolean {
    return this.isListening;
  }
}

export const checkSpeechRecognitionSupport = (): { supported: boolean; message: string } => {
  if (!isSpeechRecognitionSupported()) {
    return {
      supported: false,
      message: 'Your browser does not support speech recognition. Try using Chrome, Edge, or Safari.'
    };
  }
  
  return {
    supported: true,
    message: 'Speech recognition is supported in your browser.'
  };
}; 