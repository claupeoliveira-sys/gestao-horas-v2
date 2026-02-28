'use client';

export default function LoadingSpinner({ message = 'Aguarde...' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-clock" aria-hidden />
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
}
