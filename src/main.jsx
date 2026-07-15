import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// StrictMode é evitado aqui de propósito: ele duplica o disparo de efeitos
// em desenvolvimento, o que causaria fala/escuta duplicada (Web Speech API).
createRoot(document.getElementById('root')).render(<App />)
