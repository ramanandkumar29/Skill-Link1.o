"use client";

export interface TTSConfig {
  engine: "webspeech" | "elevenlabs" | "openai";
  elevenlabsApiKey?: string;
  elevenlabsVoiceId?: string; // Default ElevenLabs voice ID
  openaiApiKey?: string;
  openaiVoice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  speed?: number; // Voice rate multiplier (default 1.08)
}

let cachedFemaleHindiVoice: SpeechSynthesisVoice | null = null;

/**
 * Strict Standard Hindi (hi-IN) Voice Picker
 * Strictly excludes any Bengali (bn / bn-IN) or non-Hindi accents.
 * Priority Order:
 * 1. "Google हिन्दी" / "Google hi-IN" (Chrome Standard Hindi)
 * 2. "Microsoft Swara Online (Natural) - Hindi (India)"
 * 3. "Microsoft Heera - Hindi (India)"
 * 4. Any voice with (v.lang === 'hi-IN' || v.lang === 'hi_IN')
 */
export function getStandardHindiVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  if (cachedFemaleHindiVoice) return cachedFemaleHindiVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Filter helper: Must be hi-IN / hi_IN / hi, strictly NOT bn / bengali
  const isStrictHindi = (v: SpeechSynthesisVoice) => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    const isBengali = lang.includes("bn") || name.includes("bengali");
    const isHindiLang = lang === "hi-in" || lang === "hi_in" || lang.startsWith("hi");
    return isHindiLang && !isBengali;
  };

  // Priority 1: Google Hindi Neural Voice ("Google हिन्दी" or "Google hi-IN")
  const googleHindi = voices.find(
    (v) =>
      isStrictHindi(v) &&
      (v.name.toLowerCase().includes("google हिन्दी") ||
        v.name.toLowerCase().includes("google hi-in") ||
        v.name.toLowerCase().includes("google hindi"))
  );
  if (googleHindi) {
    cachedFemaleHindiVoice = googleHindi;
    return googleHindi;
  }

  // Priority 2: Microsoft Swara Online (Natural) - Hindi (India)
  const msSwara = voices.find(
    (v) =>
      isStrictHindi(v) &&
      (v.name.toLowerCase().includes("swara") || v.name.toLowerCase().includes("microsoft swara"))
  );
  if (msSwara) {
    cachedFemaleHindiVoice = msSwara;
    return msSwara;
  }

  // Priority 3: Microsoft Heera - Hindi (India)
  const msHeera = voices.find(
    (v) =>
      isStrictHindi(v) &&
      (v.name.toLowerCase().includes("heera") || v.name.toLowerCase().includes("microsoft heera"))
  );
  if (msHeera) {
    cachedFemaleHindiVoice = msHeera;
    return msHeera;
  }

  // Priority 4: Any voice where lang is strictly hi-IN or hi_IN and not Bengali
  const strictHiIn = voices.find(
    (v) =>
      (v.lang === "hi-IN" || v.lang === "hi_IN") &&
      !v.lang.toLowerCase().includes("bn") &&
      !v.name.toLowerCase().includes("bengali")
  );
  if (strictHiIn) {
    cachedFemaleHindiVoice = strictHiIn;
    return strictHiIn;
  }

  // Priority 5: Any voice matching isStrictHindi
  const anyHindi = voices.find(isStrictHindi);
  if (anyHindi) {
    cachedFemaleHindiVoice = anyHindi;
    return anyHindi;
  }

  return null;
}

export const getFemaleHindiVoice = getStandardHindiVoice;

/**
 * Clean markdown symbols (*, #, `, _, ~, >, -, +, [], ()) and artifacts for fast speech synthesis
 */
export function stripMarkdownForSpeech(text: string): string {
  if (!text) return "";
  return text
    .replace(/\[\[AI_ACTION:[\s\S]*?\]\]/g, "")
    .replace(/\[\[BOOKING_PROPOSAL:[\s\S]*?\]\]/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1") // bold
    .replace(/\*(.*?)\*/g, "$1")     // italics
    .replace(/_{1,2}(.*?)_{1,2}/g, "$1") // underline / italics
    .replace(/~{1,2}(.*? constraints)?~{1,2}/g, "$1") // strikethrough
    .replace(/#{1,6}\s?/g, "")        // headers
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1") // inline/block code
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // markdown links
    .replace(/^>\s?/gm, "")          // blockquotes
    .replace(/^[-*+]\s+/gm, "")       // bullet points
    .replace(/[*#`_~]/g, "")         // leftover symbols
    .replace(/\.{3,}/g, ".")         // remove multiple dots causing long pauses
    .replace(/\s+/g, " ")            // normalize spacing
    .trim();
}

/**
 * Format Hindi text cleanly for snappy, natural conversational speech without lag pauses
 */
export function formatConversationalHindiText(text: string): string {
  if (!text) return "";
  const clean = stripMarkdownForSpeech(text);
  return clean
    .replace(/\.{3,}/g, ".")
    .replace(/\s*([,!?.;:])\s*/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Get active TTS Configuration
 */
export function getTTSConfig(): TTSConfig {
  if (typeof window === "undefined") return { engine: "webspeech", speed: 1.08 };
  try {
    const data = localStorage.getItem("skilllink_tts_config");
    if (data) {
      const parsed = JSON.parse(data);
      return { speed: 1.08, ...parsed };
    }
  } catch (e) {
    console.error("Error reading TTS config", e);
  }
  return { engine: "webspeech", speed: 1.08 };
}

/**
 * Set active TTS Configuration
 */
export function setTTSConfig(config: TTSConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("skilllink_tts_config", JSON.stringify(config));
}

/**
 * Speak text using optimized fast, clear parameters (Default Rate: 1.08, Pitch: 1.0)
 * Supports Web Speech API + ElevenLabs & OpenAI API fallback architecture
 */
export function speakFemaleHindiText(
  rawText: string,
  onEndCallback?: () => void,
  onStartCallback?: () => void,
  customSpeed?: number
): void {
  if (typeof window === "undefined") {
    if (onEndCallback) onEndCallback();
    return;
  }

  const text = stripMarkdownForSpeech(rawText);
  if (!text) {
    if (onEndCallback) onEndCallback();
    return;
  }

  const config = getTTSConfig();
  const speed = customSpeed || config.speed || 1.08;

  // 1. ElevenLabs API Adapter (if configured)
  if (config.engine === "elevenlabs" && config.elevenlabsApiKey && config.elevenlabsVoiceId) {
    speakWithElevenLabs(text, config.elevenlabsApiKey, config.elevenlabsVoiceId, onStartCallback, onEndCallback)
      .catch(() => speakWithWebSpeech(text, onStartCallback, onEndCallback, speed));
    return;
  }

  // 2. OpenAI TTS API Adapter (if configured)
  if (config.engine === "openai" && config.openaiApiKey) {
    speakWithOpenAI(text, config.openaiApiKey, config.openaiVoice || "nova", speed, onStartCallback, onEndCallback)
      .catch(() => speakWithWebSpeech(text, onStartCallback, onEndCallback, speed));
    return;
  }

  // 3. Tuned Fast Web Speech API (Default Instant Zero-Cost Engine)
  speakWithWebSpeech(text, onStartCallback, onEndCallback, speed);
}

function speakWithWebSpeech(
  text: string,
  onStartCallback?: () => void,
  onEndCallback?: () => void,
  speed: number = 1.08
): void {
  if (!("speechSynthesis" in window)) {
    if (onEndCallback) onEndCallback();
    return;
  }

  try {
    // Cancel any ongoing or stuck speech immediately
    window.speechSynthesis.cancel();

    // Prevent browser speech synthesis engine suspension on Windows Chrome/Edge
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const conversationalText = formatConversationalHindiText(text);
    const utterance = new SpeechSynthesisUtterance(conversationalText);
    utterance.lang = "hi-IN";
    utterance.rate = Math.max(0.8, Math.min(2.0, speed)); // Fast, fluid, maintained pace
    utterance.pitch = 1.02; // Natural crisp pitch

    const femaleVoice = getStandardHindiVoice();
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    let started = false;
    utterance.onstart = () => {
      started = true;
      if (onStartCallback) onStartCallback();
    };

    utterance.onend = () => {
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (err) => {
      console.warn("SpeechSynthesis error:", err);
      if (onEndCallback) onEndCallback();
    };

    // Chrome bug workaround: ensure speech synthesis starts cleanly without hanging
    setTimeout(() => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 50);

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error("Error executing speech synthesis:", e);
    if (onEndCallback) onEndCallback();
  }
}

async function speakWithElevenLabs(
  text: string,
  apiKey: string,
  voiceId: string,
  onStartCallback?: () => void,
  onEndCallback?: () => void
): Promise<void> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
      },
    }),
  });

  if (!response.ok) throw new Error("ElevenLabs API request failed");

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  if (onStartCallback) onStartCallback();
  audio.onended = () => {
    if (onEndCallback) onEndCallback();
  };
  audio.onerror = () => {
    if (onEndCallback) onEndCallback();
  };
  await audio.play();
}

async function speakWithOpenAI(
  text: string,
  apiKey: string,
  voice: string,
  speed: number = 1.08,
  onStartCallback?: () => void,
  onEndCallback?: () => void
): Promise<void> {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice,
      speed: Math.max(0.25, Math.min(4.0, speed)),
    }),
  });

  if (!response.ok) throw new Error("OpenAI TTS API request failed");

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  if (onStartCallback) onStartCallback();
  audio.onended = () => {
    if (onEndCallback) onEndCallback();
  };
  audio.onerror = () => {
    if (onEndCallback) onEndCallback();
  };
  await audio.play();
}

// Pre-load voices listener & clear cache on voice change
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedFemaleHindiVoice = null;
    getStandardHindiVoice();
  };
}
