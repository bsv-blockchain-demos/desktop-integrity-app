import { useEffect } from 'react';

function useClearLocalStorageOnQuit() {
  useEffect(() => {
    window.electronAPI.onAppQuit(() => {
      localStorage.removeItem('keyID');
    });
  }, []);
}

export default useClearLocalStorageOnQuit;
