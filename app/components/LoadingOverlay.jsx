'use client';

export default function LoadingOverlay({ message = 'Aguarde...', active = true }) {
  if (!active) return null;
  return (
    <div
      className="loading-overlay-full"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="loading-overlay-content">
        <div className="loading-clock" aria-hidden />
        <p className="loading-overlay-message">{message}</p>
      </div>
    </div>
  );
}
