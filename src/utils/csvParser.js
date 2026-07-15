// Parser do CSV exportado do ERP (Latin-1, ';' delimitado, ~37 linhas de metadados no topo)

/** Divide uma linha de CSV respeitando aspas e o delimitador ';' */
function splitCsvLine(line, delimiter = ';') {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // aspas duplas escapadas ("")
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

/** Converte "4,00" -> 4, "1.234,50" -> 1234.5 */
function parseSaldo(raw) {
  if (!raw) return 0;
  const cleaned = raw
    .replace(/"/g, '')
    .trim()
    .replace(/\./g, '')
    .replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Lê um File (via FileReader/ArrayBuffer) decodificado como Latin-1
 * e retorna um array de produtos limpos.
 */
export function parseEstoqueCsv(text) {
  const lines = text.split(/\r\n|\r|\n/);

  // Acha a linha do cabeçalho real procurando por "CÓDIGO" e "SALDO"
  const headerIndex = lines.findIndex((l) => {
    const upper = l.toUpperCase();
    return upper.includes('CÓDIGO') && upper.includes('SALDO');
  });

  if (headerIndex === -1) {
    throw new Error(
      'Não foi possível encontrar a linha de cabeçalho (CÓDIGO;DESCRIÇÃO;...) no arquivo.'
    );
  }

  const headerFields = splitCsvLine(lines[headerIndex]).map((f) =>
    f.toUpperCase()
  );

  const idxCodigo = headerFields.findIndex((f) => f.startsWith('CÓD'));
  const idxDescricao = headerFields.findIndex((f) => f.startsWith('DESCRI'));
  const idxUnidade = headerFields.findIndex((f) => f.startsWith('UN'));
  const idxReferencia = headerFields.findIndex((f) => f.startsWith('REFER'));
  const idxLocalizacao = headerFields.findIndex((f) => f.startsWith('LOC'));
  const idxSaldo = headerFields.findIndex((f) => f.startsWith('SALDO'));

  const produtos = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw || !raw.trim()) continue;

    const fields = splitCsvLine(raw);
    const codigo = (fields[idxCodigo] || '').replace(/"/g, '').trim();
    if (!codigo) continue;

    const descricao = (fields[idxDescricao] || '').replace(/"/g, '').trim();
    const unidade = (fields[idxUnidade] || '').replace(/"/g, '').trim();
    const referencia = (fields[idxReferencia] || '').replace(/"/g, '').trim();
    const localizacao = (fields[idxLocalizacao] || '').replace(/"/g, '').trim();
    const saldoSistema = parseSaldo(fields[idxSaldo]);

    produtos.push({
      codigo,
      descricao,
      unidade,
      referencia,
      localizacao,
      saldoSistema,
    });
  }

  return produtos;
}

/** Lê um File como texto Latin-1 (ISO-8859-1) */
export function readFileAsLatin1(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const buffer = reader.result;
        const decoder = new TextDecoder('iso-8859-1');
        const text = decoder.decode(buffer);
        resolve(text);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
