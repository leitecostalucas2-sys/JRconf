// Wrapper para Web Speech API: síntese (falar) e reconhecimento (escutar) em pt-BR

export function isSpeechRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported() {
  return 'speechSynthesis' in window;
}

let vozPtBrCache = null;

function getVozPtBr() {
  if (vozPtBrCache) return vozPtBrCache;
  const vozes = window.speechSynthesis.getVoices();
  vozPtBrCache =
    vozes.find((v) => v.lang === 'pt-BR') ||
    vozes.find((v) => v.lang?.startsWith('pt')) ||
    null;
  return vozPtBrCache;
}

// Chrome carrega vozes de forma assíncrona
if (isSpeechSynthesisSupported()) {
  window.speechSynthesis.onvoiceschanged = () => {
    vozPtBrCache = null;
  };
}

/** Fala um texto em pt-BR e retorna uma Promise resolvida quando terminar */
export function falar(texto, { rate = 1.0 } = {}) {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported() || !texto) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel(); // cancela qualquer fala pendente
    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = 'pt-BR';
    const voz = getVozPtBr();
    if (voz) utter.voice = voz;
    utter.rate = rate;
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}

export function pararFala() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Cria uma instância de reconhecimento de fala configurada para pt-BR.
 * Retorna null se não suportado.
 */
export function criarReconhecimento() {
  const SpeechRecognitionCtor =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionCtor) return null;

  const recognition = new SpeechRecognitionCtor();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
  return recognition;
}

/**
 * Escuta uma única fala e resolve com o transcript (string) ou rejeita com erro.
 */
export function escutar({ timeoutMs = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    const recognition = criarReconhecimento();
    if (!recognition) {
      reject(new Error('SpeechRecognition não suportado neste navegador.'));
      return;
    }

    let finalizado = false;
    const timeout = setTimeout(() => {
      if (!finalizado) {
        finalizado = true;
        try {
          recognition.stop();
        } catch (e) {
          /* ignore */
        }
        reject(new Error('timeout'));
      }
    }, timeoutMs);

    recognition.onresult = (event) => {
      if (finalizado) return;
      finalizado = true;
      clearTimeout(timeout);
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (event) => {
      if (finalizado) return;
      finalizado = true;
      clearTimeout(timeout);
      reject(new Error(event.error || 'erro de reconhecimento'));
    };

    recognition.onend = () => {
      if (!finalizado) {
        finalizado = true;
        clearTimeout(timeout);
        reject(new Error('sem-fala'));
      }
    };

    try {
      recognition.start();
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });
}

/** Pede permissão de microfone explicitamente via getUserMedia */
export async function pedirPermissaoMicrofone() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch (err) {
    return false;
  }
}
