'use client';

import { Toaster } from 'sonner';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--toast-bg, #fff)',
          border: '1px solid var(--toast-border, #e5e7eb)',
          color: 'var(--toast-text, #111827)',
        },
        className: 'verto-toast',
      }}
      theme="system"
      richColors
      closeButton
    />
  );
}
