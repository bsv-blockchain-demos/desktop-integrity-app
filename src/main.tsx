import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './css/index.css';
import App from './App';
import { WalletProvider } from '../context/walletContext';
import { FileProvider } from '../context/fileContext';
import { BrowserRouter } from 'react-router-dom';
import ToasterWrapper from './components/toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WalletProvider>
        <FileProvider>
          <ToasterWrapper />
          <App />
        </FileProvider>
      </WalletProvider>
    </BrowserRouter>
  </StrictMode>,
);
