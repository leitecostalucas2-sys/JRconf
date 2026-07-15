import { useEffect, useState } from 'react';
import TelaInicial from './components/TelaInicial';
import Conferencia from './components/Conferencia';
import Resumo from './components/Resumo';
import {
  carregarProdutos,
  salvarProdutos,
  carregarProgresso,
  salvarProgresso,
  limparProgresso,
} from './utils/storage';
import './App.css';

export default function App() {
  const [tela, setTela] = useState('inicial'); // inicial | conferencia | resumo
  const [produtos, setProdutos] = useState(() => carregarProdutos() || []);
  const [progresso, setProgressoState] = useState(() => carregarProgresso());

  useEffect(() => {
    if (produtos && produtos.length > 0) {
      salvarProdutos(produtos);
    }
  }, [produtos]);

  function setProgresso(p) {
    setProgressoState(p);
    salvarProgresso(p);
  }

  function handleProdutosImportados(lista) {
    const comStatus = lista.map((p) => ({ ...p, status: 'pendente', saldoContado: null }));
    setProdutos(comStatus);
    limparProgresso();
    setProgressoState(null);
  }

  function handleComecar() {
    // reseta status de todos os produtos para uma nova conferência do zero
    setProdutos((prev) => prev.map((p) => ({ ...p, status: 'pendente', saldoContado: null })));
    setProgresso({ locIndex: 0, itemIndex: 0 });
    setTela('conferencia');
  }

  function handleContinuar() {
    setTela('conferencia');
  }

  function handleFinalizar() {
    limparProgresso();
    setTela('resumo');
  }

  function handlePausar() {
    setTela('inicial');
  }

  function handleNovaConferencia() {
    setTela('inicial');
  }

  const temProgressoSalvo =
    !!progresso &&
    produtos.some((p) => p.status && p.status !== 'pendente');

  return (
    <div className="app">
      {tela === 'inicial' && (
        <TelaInicial
          produtos={produtos}
          onProdutosImportados={handleProdutosImportados}
          onComecar={handleComecar}
          temProgressoSalvo={temProgressoSalvo}
          onContinuar={handleContinuar}
        />
      )}
      {tela === 'conferencia' && (
        <Conferencia
          produtos={produtos}
          setProdutos={setProdutos}
          progresso={progresso}
          setProgresso={setProgresso}
          onFinalizar={handleFinalizar}
          onPausar={handlePausar}
        />
      )}
      {tela === 'resumo' && (
        <Resumo produtos={produtos} onNovaConferencia={handleNovaConferencia} />
      )}
    </div>
  );
}
