import { gerarCsvDivergencias, baixarCsv } from '../utils/exportCsv';

export default function Resumo({ produtos, onNovaConferencia }) {
  const divergentes = produtos.filter((p) => p.status === 'divergente');
  const pulados = produtos.filter((p) => p.status === 'pulado');
  const ok = produtos.filter((p) => p.status === 'ok');

  function exportar() {
    const csv = gerarCsvDivergencias(produtos);
    const data = new Date().toISOString().slice(0, 10);
    baixarCsv(csv, `divergencias_estoque_${data}.csv`);
  }

  return (
    <div className="resumo">
      <h1>📋 Resumo da Conferência</h1>

      <div className="resumo-stats">
        <div className="stat stat-ok">
          <div className="stat-numero">{ok.length}</div>
          <div className="stat-label">Conferidos OK</div>
        </div>
        <div className="stat stat-divergente">
          <div className="stat-numero">{divergentes.length}</div>
          <div className="stat-label">Divergentes</div>
        </div>
        <div className="stat stat-pulado">
          <div className="stat-numero">{pulados.length}</div>
          <div className="stat-label">Não conferidos</div>
        </div>
      </div>

      {(divergentes.length > 0 || pulados.length > 0) && (
        <button className="botao botao-primario botao-grande" onClick={exportar}>
          ⬇️ Exportar divergências (CSV)
        </button>
      )}

      {divergentes.length > 0 && (
        <div className="card">
          <h2>⚠️ Divergências</h2>
          <div className="tabela-divergencias">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Local.</th>
                  <th>Sistema</th>
                  <th>Contado</th>
                </tr>
              </thead>
              <tbody>
                {divergentes.map((p) => (
                  <tr key={p.codigo + p.localizacao}>
                    <td>{p.codigo}</td>
                    <td>{p.descricao}</td>
                    <td>{p.localizacao}</td>
                    <td>{p.saldoSistema}</td>
                    <td className="celula-divergente">{p.saldoContado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pulados.length > 0 && (
        <div className="card">
          <h2>⏭️ Não conferidos</h2>
          <div className="tabela-divergencias">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Local.</th>
                  <th>Sistema</th>
                </tr>
              </thead>
              <tbody>
                {pulados.map((p) => (
                  <tr key={p.codigo + p.localizacao}>
                    <td>{p.codigo}</td>
                    <td>{p.descricao}</td>
                    <td>{p.localizacao}</td>
                    <td>{p.saldoSistema}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {divergentes.length === 0 && pulados.length === 0 && (
        <div className="card status-ok" style={{ textAlign: 'center' }}>
          🎉 Nenhuma divergência encontrada! Estoque 100% batido.
        </div>
      )}

      <button className="botao botao-secundario" onClick={onNovaConferencia}>
        🔄 Nova conferência
      </button>
    </div>
  );
}
