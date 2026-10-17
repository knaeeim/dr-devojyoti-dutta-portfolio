'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SessionTitleInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Stable, mobile-friendly session title input.
 * Prevents mobile keyboards from auto-closing / jumping by:
 * 1. Maintaining local input state during typing to isolate from heavy parent re-renders.
 * 2. Using text-[16px] on mobile to prevent iOS Safari auto-zoom viewport jumping.
 * 3. Debouncing parent commits (150ms) + immediate flush onBlur.
 * 4. Disabling autocorrect/spellcheck and setting enterKeyHint="done".
 */
export default function SessionTitleInput({
  value,
  onChange,
  placeholder = 'সেশনের নাম (যেমন: সকাল সেশন)',
  className = ''
}: SessionTitleInputProps) {
  const [text, setText] = useState<string>(value || '');
  const isFocusedRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestTextRef = useRef<string>(value || '');

  // Keep latest text in ref for cleanup and blur
  latestTextRef.current = text;

  // Sync from props only when not actively typing/focused
  useEffect(() => {
    if (!isFocusedRef.current && (value || '') !== text) {
      setText(value || '');
    }
  }, [value]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const flushChange = (valToCommit: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    onChange(valToCommit);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setText(nextVal);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onChange(nextVal);
    }, 150);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    flushChange(latestTextRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      flushChange(latestTextRef.current);
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      value={text}
      placeholder={placeholder}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="none"
      spellCheck={false}
      enterKeyHint="done"
      className={className}
    />
  );
}
