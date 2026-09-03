/**
 * Lexi AI Unified Voice Engine — Skill-Link
 * Modular Speech-to-Text (STT) and Text-to-Speech (TTS) manager.
 * Supports English, Hindi, and Hinglish with interruption handling, natural text cleaning, and fallback.
 */

export type VoiceState = "IDLE" | "LISTENING" | "PROCESSING" | "SPEAKING" | "ERROR";
export type VoiceLanguage = "hi-IN" | "en-IN" | "en-US";

export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onInterim?: (transcript: string) => void;
  onResult?: (transcript: string, isFinal?: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  language?: VoiceLanguage;
}

class LexiVoiceManager {
  private recognition: any = null;
  private currentLanguage: VoiceLanguage = "hi-IN";
  private isListeningState: boolean = false;
  private isSpeakingState: boolean = false;
  private voiceEnabled: boolean = false; // Auto speech OFF by default
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private playbackSpeed: number = 1.0;
  private voiceMode: "auto" | "hindi" | "english" | "hinglish" = "auto";
  private lastSpokenText: string = "";

  constructor() {
    this.initRecognition();
    this.initVoices();
  }

  private initVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const loadVoices = () => {
      this.availableVoices = window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Initializes browser SpeechRecognition instance
   */
  private initRecognition() {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentLanguage;
        this.recognition.maxAlternatives = 1;
      } catch (e) {
        console.warn("[Lexi Voice] Error creating SpeechRecognition:", e);
      }
    }
  }

  public isSupported(): { stt: boolean; tts: boolean } {
    const hasSTT = typeof window !== "undefined" && (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);
    const hasTTS = typeof window !== "undefined" && "speechSynthesis" in window;
    return { stt: hasSTT, tts: hasTTS };
  }

  public setLanguage(lang: VoiceLanguage) {
    this.currentLanguage = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public getLanguage(): VoiceLanguage {
    return this.currentLanguage;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    if (!enabled) {
      this.stopSpeaking();
    }
  }

  public isVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  /**
   * Starts Speech Recognition with callbacks
   */
  public startListening(handlers: SpeechRecognitionHandlers = {}) {
    this.stopSpeaking(); // Interrupt any ongoing speech playback

    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      handlers.onError?.("Voice recognition is not supported in this browser. Please use text input.");
      return;
    }

    if (this.isListeningState) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }

    if (handlers.language) {
      this.recognition.lang = handlers.language;
    }

    this.recognition.onstart = () => {
      this.isListeningState = true;
      handlers.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      if (interimTranscript) {
        handlers.onInterim?.(interimTranscript);
        handlers.onResult?.(interimTranscript, false);
      }
      if (finalTranscript) {
        handlers.onResult?.(finalTranscript.trim(), true);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListeningState = false;
      let errorMsg = "Could not recognize speech. Please try again.";
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        errorMsg = "Microphone access was denied. Please allow microphone permissions in your browser.";
      } else if (event.error === "no-speech") {
        errorMsg = "No speech detected. Tap the mic and speak clearly.";
      } else if (event.error === "network") {
        errorMsg = "Network error during speech recognition. Please check your internet connection.";
      }
      handlers.onError?.(errorMsg);
    };

    this.recognition.onend = () => {
      this.isListeningState = false;
      handlers.onEnd?.();
    };

    try {
      this.recognition.start();
    } catch (err: any) {
      this.isListeningState = false;
      console.warn("[Lexi Voice] Start error:", err);
      handlers.onError?.("Microphone is already active or unavailable.");
    }
  }

  /**
   * Stops Speech Recognition
   */
  public stopListening() {
    if (this.recognition && this.isListeningState) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.isListeningState = false;
    }
  }

  /**
   * Cleans text response for natural TTS speech synthesis (removes markdown, URLs, emojis)
   */
  private cleanTextForSpeech(rawText: string): string {
    if (!rawText) return "";

    return rawText
      .replace(/###\s*\[.*?\]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[`*#_~[\]()]/g, "")
      .replace(/•\s*/g, ", ")
      .replace(/₹\s*(\d+)/g, "rupees $1")
      .replace(/[🏆🎉💡✅⭐★✓]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Speaks assistant response using Web Speech Synthesis API
   */
  public speak(
    text: string,
    options?: { onStart?: () => void; onEnd?: () => void; onError?: () => void; force?: boolean } | VoiceLanguage
  ) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const opts = typeof options === "object" ? options : {};
    const explicitLang = typeof options === "string" ? options : undefined;

    // Only speak if voice is enabled or user explicitly triggered Listen (force=true or explicitLang passed)
    const isExplicitTrigger = !!opts.force || !!explicitLang;
    if (!this.voiceEnabled && !isExplicitTrigger) {
      return;
    }

    // Cancel any ongoing speech immediately to prevent overlap
    this.stopSpeaking();

    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) return;

    // Speak concise summary if response is very long
    let textToSpeak = cleanText;
    if (cleanText.length > 300) {
      const sentences = cleanText.split(/[.!?]\s+/);
      textToSpeak = sentences.slice(0, 2).join(". ") + ".";
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    this.activeUtterance = utterance;

    // Detect Hindi / English
    const isHindi =
      this.voiceMode === "hindi" || this.voiceMode === "hinglish"
        ? true
        : this.voiceMode === "english"
        ? false
        : explicitLang
        ? explicitLang.startsWith("hi")
        : /[\u0900-\u097F]|namaste|hai|hoon|karein|chahiye|samajh|paani|bijli/i.test(text);

    utterance.lang = isHindi ? "hi-IN" : "en-IN";
    utterance.rate = this.playbackSpeed;
    utterance.pitch = 1.05;
    this.lastSpokenText = text;

    // Select suitable female assistant voice if available
    const voices = this.availableVoices.length > 0 ? this.availableVoices : window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        (isHindi && (v.lang.includes("hi") || v.name.includes("Hindi") || v.name.includes("India"))) ||
        (!isHindi && (v.lang.includes("en-IN") || v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Zira")))
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.isSpeakingState = true;
      opts.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      this.activeUtterance = null;
      opts.onEnd?.();
    };

    utterance.onerror = () => {
      this.isSpeakingState = false;
      this.activeUtterance = null;
      opts.onError?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stops any active speech playback
   */
  public stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this.isSpeakingState = false;
      this.activeUtterance = null;
    }
  }

  public setPlaybackSpeed(speed: number) {
    this.playbackSpeed = speed;
  }

  public getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  public setVoiceMode(mode: "auto" | "hindi" | "english" | "hinglish") {
    this.voiceMode = mode;
  }

  public getVoiceMode(): "auto" | "hindi" | "english" | "hinglish" {
    return this.voiceMode;
  }

  public replay() {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText, { force: true });
    }
  }

  public hasNaturalHindiVoice(): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
    const voices = this.availableVoices.length > 0 ? this.availableVoices : window.speechSynthesis.getVoices();
    return voices.some((v) => v.lang.includes("hi") || v.name.toLowerCase().includes("hindi"));
  }

  public isListening(): boolean {
    return this.isListeningState;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public isSpeakingNow(): boolean {
    return this.isSpeakingState;
  }
}

export const lexiVoice = new LexiVoiceManager();
