import { useRef, useState } from 'react';
import { parseEstoqueCsv, readFileAsLatin1 } from '../utils/csvParser';
import {
  pedirPermissaoMicrofone,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
} from '../utils/voz';

export default function TelaInicial({
  produtos,
  onProdutosImportados,
  onComecar,
  temProgressoSalvo,
  onContinuar,
}) {
  const inputRef = useRef(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [permissaoStatus, setPermissaoStatus] = useState('nao-solicitada'); // nao-solicitada | concedida | negada

  const suportaReconhecimento = isSpeechRecognitionSupported();
  const suportaSintese = isSpeechSynthesisSupported();

  async function handleArquivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCarregando(true);
    setErro(null);
    try {
      const texto = await readFileAsLatin1(file);
      const lista = parseEstoqueCsv(texto);
      if (lista.length === 0) {
        throw new Error(
          'Nenhum produto encontrado no arquivo. Confira o formato do CSV.'
        );
      }
      onProdutosImportados(lista);
    } catch (err) {
      setErro(err.message || 'Erro ao importar o arquivo.');
    } finally {
      setCarregando(false);
      e.target.value = '';
    }
  }

  async function handlePedirPermissao() {
    const ok = await pedirPermissaoMicrofone();
    setPermissaoStatus(ok ? 'concedida' : 'negada');
  }

  return (
    <div className="tela-inicial">
      <div className="tela-inicial-header">
        <h1>📦 Conferência de Estoque por Voz</h1>
        <p className="subtitulo">JR Autopeças &amp; Baterias</p>
      </div>

      {!suportaReconhecimento && (
        <div className="aviso aviso-atencao">
          ⚠️ Este navegador tem suporte limitado a reconhecimento de fala
          contínuo (comum no Safari/iOS). Recomendamos usar <b>Chrome</b> ou{' '}
          <b>Edge</b> para a melhor experiência por voz. O modo manual (digitar
          o saldo) sempre funciona como alternativa.
        </div>
      )}

      <div className="card">
        <h2>🎤 Permissão de microfone</h2>
        <p>
          Para conferir o estoque falando os saldos, o app precisa escutar sua
          voz através do microfone do celular/notebook. O áudio não é
          gravado nem enviado a nenhum servidor — tudo é processado
          localmente pelo navegador.
        </p>
        {permissaoStatus === 'nao-solicitada' && (
          <button className="botao botao-secundario" onClick={handlePedirPermissao}>
            Permitir uso do microfone
          </button>
        )}
        {permissaoStatus === 'concedida' && (
          <div className="status-ok">✅ Permissão concedida</div>
        )}
        {permissaoStatus === 'negada' && (
          <div className="status-erro">
            ❌ Permissão negada. Você ainda pode usar o app no{' '}
            <b>modo manual</b>, digitando os saldos contados a cada item.
            Para reativar o microfone, ajuste as permissões do site nas
            configurações do navegador.
          </div>
        )}
      </div>

      <div className="card">
        <h2>📄 Arquivo de estoque</h2>
        {produtos && produtos.length > 0 ? (
          <p className="status-ok">
            ✅ {produtos.length} produtos carregados
          </p>
        ) : (
          <p>Nenhum arquivo importado ainda.</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleArquivo}
          style={{ display: 'none' }}
        />
        <button
          className="botao botao-secundario"
          onClick={() => inputRef.current?.click()}
          disabled={carregando}
        >
          {carregando
            ? 'Importando...'
            : produtos && produtos.length > 0
            ? 'Importar / trocar CSV'
            : 'Importar CSV do estoque'}
        </button>
        {erro && <div className="status-erro">❌ {erro}</div>}
      </div>

      <div className="acoes-principais">
        {temProgressoSalvo && (
          <button className="botao botao-primario" onClick={onContinuar}>
            ▶️ Continuar de onde parei
          </button>
        )}
        <button
          className="botao botao-primario botao-grande"
          onClick={onComecar}
          disabled={!produtos || produtos.length === 0}
        >
          🚀 Começar Conferência
        </button>
      </div>
    </div>
  );
}
