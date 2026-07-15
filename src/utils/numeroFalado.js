// Extrai um número de um transcript de fala em pt-BR.
// 1) Tenta achar dígitos direto. 2) Fallback: parser de números por extenso.

const UNIDADES = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  três: 3,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  catorze: 14,
  quatorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
};

const DEZENAS = {
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  cinqüenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
};

const CENTENAS = {
  cem: 100,
  cento: 100,
  duzentos: 200,
  duzentas: 200,
  trezentos: 300,
  trezentas: 300,
  quatrocentos: 400,
  quatrocentas: 400,
  quinhentos: 500,
  quinhentas: 500,
  seiscentos: 600,
  seiscentas: 600,
  setecentos: 700,
  setecentas: 700,
  oitocentos: 800,
  oitocentas: 800,
  novecentos: 900,
  novecentas: 900,
};

const MULTIPLICADORES = {
  mil: 1000,
};

function normalizeWord(w) {
  return w
    .toLowerCase()
    .trim()
    .normalize('NFC');
}

/**
 * Parser de números por extenso em português (0 a milhares),
 * cobre o vocabulário comum de contagem de estoque.
 * Ex: "trinta e dois" -> 32, "cento e cinco" -> 105, "mil e vinte" -> 1020
 */
export function parseNumeroPorExtenso(transcript) {
  const words = transcript
    .toLowerCase()
    .replace(/[.,!?]/g, ' ')
    .split(/\s+/)
    .map(normalizeWord)
    .filter((w) => w && w !== 'e');

  if (words.length === 0) return null;

  let total = 0;
  let current = 0;
  let matchedAny = false;

  for (const word of words) {
    if (word in MULTIPLICADORES) {
      matchedAny = true;
      const mult = MULTIPLICADORES[word];
      current = current === 0 ? 1 : current;
      total += current * mult;
      current = 0;
    } else if (word in CENTENAS) {
      matchedAny = true;
      current += CENTENAS[word];
    } else if (word in DEZENAS) {
      matchedAny = true;
      current += DEZENAS[word];
    } else if (word in UNIDADES) {
      matchedAny = true;
      current += UNIDADES[word];
    }
    // palavras desconhecidas são ignoradas silenciosamente
  }

  if (!matchedAny) return null;
  return total + current;
}

/**
 * Extrai o saldo contado a partir do transcript de voz.
 * Retorna um número inteiro/decimal, ou null se não conseguir interpretar.
 */
export function extrairNumeroDoTranscript(transcript) {
  if (!transcript) return null;

  // 1) Tenta achar dígitos direto (com suporte a decimal com vírgula ou ponto)
  const digitMatch = transcript.match(/\d+(?:[.,]\d+)?/);
  if (digitMatch) {
    const n = parseFloat(digitMatch[0].replace(',', '.'));
    if (!Number.isNaN(n)) return n;
  }

  // 2) Fallback: número por extenso
  const extenso = parseNumeroPorExtenso(transcript);
  if (extenso !== null) return extenso;

  return null;
}
