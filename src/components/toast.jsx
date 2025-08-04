import { Toaster } from 'react-hot-toast';

export default function ToasterWrapper() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          color: '#e0e0e0',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
          fontWeight: '500',
        },
        success: {
          style: {
            borderLeft: '4px solid #10b981',
          },
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        error: {
          style: {
            borderLeft: '4px solid #ef4444',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
        loading: {
          style: {
            borderLeft: '4px solid #6366f1',
          },
          iconTheme: {
            primary: '#6366f1',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
}