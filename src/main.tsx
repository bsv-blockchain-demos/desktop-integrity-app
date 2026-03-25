import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './css/index.css';
import App from './App';
import { WalletProvider } from '../context/walletContext';
import { FileProvider } from '../context/fileContext';
import { HashRouter } from 'react-router-dom';
import ToasterWrapper from './components/toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <WalletProvider>
        <FileProvider>
          <ToasterWrapper />
          <App />
        </FileProvider>
      </WalletProvider>
    </HashRouter>
  </StrictMode>,
);
