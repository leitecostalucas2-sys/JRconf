# Conferência de Estoque por Voz — JR Autopeças & Baterias

App mobile-first, 100% client-side (React + Vite), para conferir o saldo
físico do estoque no depósito usando voz, sem precisar digitar nada durante
a contagem.

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado (ex: http://localhost:5173) no celular ou notebook.
Para usar no celular na mesma rede: `npm run dev -- --host` e acesse pelo IP
da máquina.

## Build de produção (app estático)

```bash
npm run build
```

Gera a pasta `dist/` — pode subir em qualquer hospedagem estática (Netlify,
Vercel, GitHub Pages, ou até um pendrive/servidor local).

## Fluxo de uso

1. **Importar CSV**: exporte o relatório de contagem de estoque do ERP
   (menu de estoque → exportar CSV) e importe pelo botão na tela inicial.
   O app ignora automaticamente as ~37 linhas de metadados do topo e lê a
   partir do cabeçalho real (`CÓDIGO;DESCRIÇÃO;UN.;REFERÊNCIA;LOC.FÍSICA;SALDO`).
2. **Permitir microfone**: conceda a permissão na tela inicial (mensagem
   explica que o áudio não é gravado nem enviado a servidor nenhum).
3. **Começar Conferência**: os produtos são agrupados por localização física,
   ordenados numericamente (B 0009 < B 0011 < B 0100).
4. Para cada item, o app **fala** a descrição + saldo do sistema, depois
   **escuta** o saldo contado. Bateu → ✓ verde automático. Divergiu → marca
   laranja, salva o novo saldo e avança.
5. Ao final, tela de **resumo** com apenas as divergências e itens não
   conferidos, com botão para exportar CSV pronto para reimportar no ERP.

## Atalhos/recursos durante a contagem

- 🔁 Repetir a última fala
- ✏️ Digitar o saldo manualmente (a qualquer momento, sem depender do microfone)
- ⏭️ Pular item ou localização inteira (fica marcado como "não conferido")
- ⏸️ Pausar — o progresso fica salvo no `localStorage` e pode continuar depois

## Limitações conhecidas

- Reconhecimento de fala contínuo funciona bem no **Chrome/Edge**. No
  Safari/iOS o suporte é limitado — o app avisa isso na tela inicial e
  sempre oferece o campo manual como alternativa.
- Tudo roda no navegador: não há backend, não há envio de áudio/dados para
  fora do dispositivo.

## Estrutura

```
src/
  components/
    TelaInicial.jsx   — importação de CSV + permissão de microfone
    Conferencia.jsx   — loop de fala/escuta por item
    Resumo.jsx        — tela final + exportação CSV
  utils/
    csvParser.js      — parser do CSV do ERP (Latin-1, ';')
    naturalSort.js     — ordenação natural das localizações físicas
    numeroFalado.js    — extração de números de transcript de voz (dígitos + extenso)
    voz.js             — wrappers de speechSynthesis / SpeechRecognition
    storage.js         — persistência em localStorage
    exportCsv.js       — geração do CSV de divergências
```
