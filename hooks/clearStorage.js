import { useEffect } from 'react';

function useClearLocalStorageOnQuit() {
  useEffect(() => {
    window.electronAPI.onAppQuit(() => {
      console.log('App is quitting... clearing localStorage');
      localStorage.clear();
      window.electronAPI.confirmQuit();
    });
  }, []);
}

export default useClearLocalStorageOnQuit;
