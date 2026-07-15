// Ordenação natural de localizações físicas: "B 0009" < "B 0011" < "B 0100"
// Separa a string em blocos de letras e números e compara bloco a bloco.

function tokenize(str) {
  return String(str)
    .trim()
    .match(/[A-Za-zÀ-ÿ]+|\d+/g) || [];
}

export function naturalCompare(a, b) {
  const ta = tokenize(a);
  const tb = tokenize(b);
  const len = Math.max(ta.length, tb.length);

  for (let i = 0; i < len; i++) {
    const pa = ta[i];
    const pb = tb[i];
    if (pa === undefined) return -1;
    if (pb === undefined) return 1;

    const na = /^\d+$/.test(pa) ? parseInt(pa, 10) : null;
    const nb = /^\d+$/.test(pb) ? parseInt(pb, 10) : null;

    if (na !== null && nb !== null) {
      if (na !== nb) return na - nb;
    } else {
      const cmp = pa.localeCompare(pb, 'pt-BR', { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

export function naturalSortBy(arr, keyFn) {
  return [...arr].sort((a, b) => naturalCompare(keyFn(a), keyFn(b)));
}
