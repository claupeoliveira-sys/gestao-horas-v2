'use client';

import { useState, useEffect, useRef } from 'react';

export function useDebouncedValue(value, delayMs = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
