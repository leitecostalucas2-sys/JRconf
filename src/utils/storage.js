// Persistência do estado de conferência no localStorage

const CHAVE_PRODUTOS = 'estoqueVoz.produtos';
const CHAVE_PROGRESSO = 'estoqueVoz.progresso';

export function salvarProdutos(produtos) {
  localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));
}

export function carregarProdutos() {
  const raw = localStorage.getItem(CHAVE_PRODUTOS);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function salvarProgresso(progresso) {
  localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(progresso));
}

export function carregarProgresso() {
  const raw = localStorage.getItem(CHAVE_PROGRESSO);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function limparProgresso() {
  localStorage.removeItem(CHAVE_PROGRESSO);
}

export function limparTudo() {
  localStorage.removeItem(CHAVE_PRODUTOS);
  localStorage.removeItem(CHAVE_PROGRESSO);
}
