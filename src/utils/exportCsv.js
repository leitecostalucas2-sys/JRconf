// Exporta divergências (e itens não conferidos) como CSV para reimportar no ERP

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[;"\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function gerarCsvDivergencias(produtos) {
  const cabecalho = [
    'CÓDIGO',
    'DESCRIÇÃO',
    'UN.',
    'REFERÊNCIA',
    'LOC.FÍSICA',
    'SALDO_SISTEMA',
    'SALDO_CONTADO',
    'STATUS',
  ];

  const linhas = produtos
    .filter((p) => p.status === 'divergente' || p.status === 'pulado')
    .map((p) =>
      [
        p.codigo,
        p.descricao,
        p.unidade,
        p.referencia,
        p.localizacao,
        p.saldoSistema.toFixed(2).replace('.', ','),
        p.status === 'divergente'
          ? (p.saldoContado ?? 0).toFixed(2).replace('.', ',')
          : '',
        p.status === 'pulado' ? 'NAO_CONFERIDO' : 'DIVERGENTE',
      ]
        .map(csvEscape)
        .join(';')
    );

  return [cabecalho.join(';'), ...linhas].join('\r\n');
}

export function baixarCsv(conteudo, nomeArquivo) {
  // BOM para o Excel reconhecer UTF-8 corretamente com acentos
  const blob = new Blob(['\uFEFF' + conteudo], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
