import { createContext, useContext, useState, useEffect } from 'react';
import { Icon } from './Icon';

const ToastContext = createContext(null);

function Toast({ children, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast-host">
      <div className="toast">
        <Icon name="shield-check" size={16} color="var(--brand)" />
        {children}
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const show = (msg) => setToast(msg);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && <Toast onDone={() => setToast(null)}>{toast}</Toast>}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
