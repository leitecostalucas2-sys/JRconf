import { useEffect, useMemo, useRef, useState } from 'react';
import { naturalSortBy } from '../utils/naturalSort';
import { falar, pararFala, escutar, isSpeechRecognitionSupported } from '../utils/voz';
import { extrairNumeroDoTranscript } from '../utils/numeroFalado';

/**
 * Agrupa produtos por localização física, já ordenados numericamente.
 */
function agruparPorLocalizacao(produtos) {
  const mapa = new Map();
  for (const p of produtos) {
    if (!mapa.has(p.localizacao)) mapa.set(p.localizacao, []);
    mapa.get(p.localizacao).push(p);
  }
  const localizacoes = naturalSortBy([...mapa.keys()], (l) => l);
  return localizacoes.map((loc) => ({ localizacao: loc, itens: mapa.get(loc) }));
}

function descricaoParaFala(produto) {
  const desc = produto.descricao.toLowerCase();
  const saldo = Math.round(produto.saldoSistema);
  return `${desc}, saldo ${saldo}`;
}

export default function Conferencia({
  produtos,
  setProdutos,
  progresso,
  setProgresso,
  onFinalizar,
  onPausar,
}) {
  const grupos = useMemo(() => agruparPorLocalizacao(produtos), [produtos]);
  const [locIndex, setLocIndex] = useState(progresso?.locIndex ?? 0);
  const [itemIndex, setItemIndex] = useState(progresso?.itemIndex ?? 0);
  const [estado, setEstado] = useState('parado'); // parado | falando | escutando | erro
  const [ultimoErroVoz, setUltimoErroVoz] = useState(null);
  const [edicaoManual, setEdicaoManual] = useState(null); // {codigo} do item em edição manual
  const [valorManual, setValorManual] = useState('');
  const cicloAtivoRef = useRef(0); // usado para cancelar ciclos anteriores

  const grupoAtual = grupos[locIndex];
  const itemAtual = grupoAtual?.itens[itemIndex];

  const totalLocalizacoes = grupos.length;
  const totalItensGrupo = grupoAtual?.itens.length ?? 0;

  // salva progresso sempre que mudar
  useEffect(() => {
    setProgresso({ locIndex, itemIndex });
  }, [locIndex, itemIndex]);

  function atualizarItem(codigo, patch) {
    setProdutos((prev) =>
      prev.map((p) => (p.codigo === codigo && p.localizacao === itemAtual.localizacao ? { ...p, ...patch } : p))
    );
  }

  function avancar() {
    setEdicaoManual(null);
    if (itemIndex + 1 < totalItensGrupo) {
      setItemIndex(itemIndex + 1);
    } else if (locIndex + 1 < totalLocalizacoes) {
      setLocIndex(locIndex + 1);
      setItemIndex(0);
    } else {
      onFinalizar();
    }
  }

  function pularItem() {
    if (!itemAtual) return;
    atualizarItem(itemAtual.codigo, { status: 'pulado' });
    avancar();
  }

  function pularLocalizacao() {
    if (!grupoAtual) return;
    setProdutos((prev) =>
      prev.map((p) =>
        p.localizacao === grupoAtual.localizacao && (!p.status || p.status === 'pendente')
          ? { ...p, status: 'pulado' }
          : p
      )
    );
    if (locIndex + 1 < totalLocalizacoes) {
      setLocIndex(locIndex + 1);
      setItemIndex(0);
    } else {
      onFinalizar();
    }
  }

  async function processarSaldoContado(saldoContado) {
    if (!itemAtual) return;
    const bate = Math.round(saldoContado) === Math.round(itemAtual.saldoSistema);
    if (bate) {
      atualizarItem(itemAtual.codigo, {
        status: 'ok',
        saldoContado,
      });
      avancar();
    } else {
      atualizarItem(itemAtual.codigo, {
        status: 'divergente',
        saldoContado,
      });
      setEstado('falando');
      await falar(`Saldo atualizado para ${Math.round(saldoContado)}`);
      avancar();
    }
  }

  async function cicloDeVozParaItem() {
    if (!itemAtual) return;
    const meuCiclo = ++cicloAtivoRef.current;
    setUltimoErroVoz(null);
    setEstado('falando');
    await falar(descricaoParaFala(itemAtual));
    if (cicloAtivoRef.current !== meuCiclo) return; // ciclo cancelado (usuário avançou/pausou)

    if (!isSpeechRecognitionSupported()) {
      setEstado('erro');
      setUltimoErroVoz('Reconhecimento de voz não suportado. Use o modo manual.');
      return;
    }

    await escutarComRetry(meuCiclo);
  }

  async function escutarComRetry(meuCiclo, tentativas = 0) {
    setEstado('escutando');
    try {
      const transcript = await escutar({ timeoutMs: 8000 });
      if (cicloAtivoRef.current !== meuCiclo) return;
      const numero = extrairNumeroDoTranscript(transcript);
      if (numero === null) {
        if (tentativas >= 2) {
          setEstado('erro');
          setUltimoErroVoz(
            `Não consegui entender "${transcript}". Use o campo manual abaixo.`
          );
          return;
        }
        setEstado('falando');
        await falar('Não entendi, pode repetir o saldo?');
        if (cicloAtivoRef.current !== meuCiclo) return;
        await escutarComRetry(meuCiclo, tentativas + 1);
        return;
      }
      await processarSaldoContado(numero);
    } catch (err) {
      if (cicloAtivoRef.current !== meuCiclo) return;
      setEstado('erro');
      setUltimoErroVoz(
        'Não foi possível captar sua voz (' +
          (err.message || 'erro desconhecido') +
          '). Tente novamente ou use o campo manual.'
      );
    }
  }

  function repetirFala() {
    cicloDeVozParaItem();
  }

  function abrirEdicaoManual(codigo, saldoAtual) {
    cicloAtivoRef.current++; // cancela ciclo de voz em andamento
    pararFala();
    setEstado('parado');
    setEdicaoManual(codigo);
    setValorManual(saldoAtual != null ? String(saldoAtual) : '');
  }

  function confirmarManual() {
    const n = parseFloat(String(valorManual).replace(',', '.'));
    if (Number.isNaN(n)) return;
    processarSaldoContado(n);
  }

  function pausar() {
    cicloAtivoRef.current++;
    pararFala();
    if (window.speechRecognitionInstance) {
      try {
        window.speechRecognitionInstance.stop();
      } catch (e) {}
    }
    setEstado('parado');
    onPausar();
  }

  // inicia o ciclo de voz automaticamente ao trocar de item
  useEffect(() => {
    if (!itemAtual) return;
    if (edicaoManual) return;
    if (itemAtual.status === 'ok' || itemAtual.status === 'divergente' || itemAtual.status === 'pulado') {
      // item já conferido (ex: voltou via navegação) — avança
      return;
    }
    cicloDeVozParaItem();
    return () => {
      cicloAtivoRef.current++; // cancela ao desmontar/trocar
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locIndex, itemIndex]);

  if (!grupoAtual || !itemAtual) {
    return <div className="conferencia">Conferência concluída.</div>;
  }

  const progressoGeralPct = Math.round(
    ((locIndex + itemIndex / totalItensGrupo) / totalLocalizacoes) * 100
  );

  return (
    <div className="conferencia">
      <div className="barra-topo">
        <button className="botao botao-icone" onClick={pausar} title="Pausar">
          ⏸️
        </button>
        <div className="progresso-textos">
          <div>Localização {locIndex + 1} de {totalLocalizacoes}</div>
          <div>Item {itemIndex + 1} de {totalItensGrupo}</div>
        </div>
      </div>

      <div className="barra-progresso-container">
        <div className="barra-progresso" style={{ width: `${progressoGeralPct}%` }} />
      </div>

      <div className="localizacao-destaque">
        📍 {grupoAtual.localizacao}
        <span className="localizacao-sub">{totalItensGrupo} produto(s)</span>
      </div>

      <div className={`card item-card ${itemAtual.status ? 'item-card--' + itemAtual.status : ''}`}>
        <div className="item-codigo">{itemAtual.codigo}</div>
        <div className="item-descricao">{itemAtual.descricao}</div>
        <div className="item-meta">
          {itemAtual.unidade} · Ref: {itemAtual.referencia || '—'}
        </div>
        <div className="item-saldo-sistema">Saldo sistema: <b>{itemAtual.saldoSistema}</b></div>

        {estado === 'falando' && <div className="indicador indicador-falando">🔊 Falando...</div>}
        {estado === 'escutando' && <div className="indicador indicador-escutando">🎙️ Escutando...</div>}
        {estado === 'erro' && ultimoErroVoz && (
          <div className="status-erro">{ultimoErroVoz}</div>
        )}

        <div className="botoes-item">
          <button className="botao botao-secundario" onClick={repetirFala}>
            🔁 Repetir
          </button>
          <button
            className="botao botao-secundario"
            onClick={() => abrirEdicaoManual(itemAtual.codigo, itemAtual.saldoContado)}
          >
            ✏️ Digitar saldo
          </button>
          <button className="botao botao-secundario" onClick={pularItem}>
            ⏭️ Pular item
          </button>
        </div>

        {edicaoManual === itemAtual.codigo && (
          <div className="edicao-manual">
            <input
              type="number"
              inputMode="decimal"
              autoFocus
              value={valorManual}
              onChange={(e) => setValorManual(e.target.value)}
              placeholder="Saldo contado"
              className="input-manual"
            />
            <button className="botao botao-primario" onClick={confirmarManual}>
              ✅ Confirmar
            </button>
          </div>
        )}
      </div>

      <button className="botao botao-terciario" onClick={pularLocalizacao}>
        ⏭️⏭️ Pular localização inteira
      </button>
    </div>
  );
}
