import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './App.jsx'
import { WalletProvider } from '../context/walletContext.jsx'
import { BrowserRouter } from 'react-router-dom'
import ToasterWrapper from './components/toast.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WalletProvider>
      <BrowserRouter>
      <ToasterWrapper />
        <App />
      </BrowserRouter>
    </WalletProvider>
  </StrictMode>,
)
