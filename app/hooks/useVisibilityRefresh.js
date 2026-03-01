'use client';

import { useEffect, useRef } from 'react';

/**
 * Chama onVisible quando o usuário retorna à aba (document.visibilityState === 'visible').
 * Útil para recarregar dados ao voltar para a página.
 * @param {() => void} onVisible - Função de recarregamento (ex: loadData)
 * @param {boolean} enabled - Se o listener está ativo (ex: pathname === '/')
 */
export function useVisibilityRefresh(onVisible, enabled = true) {
  const wasHidden = useRef(false);
  useEffect(() => {
    if (!enabled || typeof onVisible !== 'function') return;
    function handleVisibility() {
      if (document.visibilityState === 'hidden') {
        wasHidden.current = true;
      } else if (document.visibilityState === 'visible' && wasHidden.current) {
        wasHidden.current = false;
        onVisible();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [onVisible, enabled]);
}
