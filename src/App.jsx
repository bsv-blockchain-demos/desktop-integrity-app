import './App.css'
import { Routes, Route } from 'react-router-dom'
import Homepage from './components/homepage'
import Logs from './components/logs'
import Status from './components/status'
import Navbar from './components/navbar'
import { WalletProvider } from './context/walletContext'

function App() {
  return (
    <WalletProvider>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/status" element={<Status />} />
        </Routes>
      </div>
    </WalletProvider>
  )
}

export default App
