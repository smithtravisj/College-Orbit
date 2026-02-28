'use client';

import { DeleteToast, useDeleteToast, hideDeleteToast, useSuccessToast, SuccessToast, useErrorToast, ErrorToast } from './ui/DeleteToast';

export function DeleteToastProvider() {
  const deleteToasts = useDeleteToast();
  const successToasts = useSuccessToast();
  const errorToasts = useErrorToast();

  const hasToasts = deleteToasts.length > 0 || successToasts.length > 0 || errorToasts.length > 0;
  if (!hasToasts) return null;

  // Calculate positions - success/error toasts at top, delete toasts at bottom
  let topOffset = 24;

  return (
    <>
      {/* Success toasts at top */}
      {successToasts.map((toast) => {
        const offset = topOffset;
        topOffset += 60;
        return (
          <div
            key={toast.id}
            style={{
              position: 'fixed',
              top: `${offset}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              animation: 'slideDown 0.3s ease-out',
            }}
          >
            <SuccessToast message={toast.message} exiting={toast.exiting} />
          </div>
        );
      })}

      {/* Error toasts at top (below success) */}
      {errorToasts.map((toast) => {
        const offset = topOffset;
        topOffset += 60;
        return (
          <div
            key={toast.id}
            style={{
              position: 'fixed',
              top: `${offset}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              animation: 'slideDown 0.3s ease-out',
            }}
          >
            <ErrorToast message={toast.message} exiting={toast.exiting} />
          </div>
        );
      })}

      {/* Delete toasts at bottom */}
      {deleteToasts.map((toast, index) => (
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
