'use client';

import { DeleteToast, useDeleteToast, hideDeleteToast } from './ui/DeleteToast';

export function DeleteToastProvider() {
  const toasts = useDeleteToast();

  if (toasts.length === 0) return null;

  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            bottom: `${24 + index * 70}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999 - index,
          }}
        >
          <DeleteToast
            message={toast.message}
            onUndo={() => {
              toast.onUndo();
              hideDeleteToast(toast.id);
            }}
            onDismiss={() => hideDeleteToast(toast.id)}
          />
        </div>
      ))}
    </>
  );
}
