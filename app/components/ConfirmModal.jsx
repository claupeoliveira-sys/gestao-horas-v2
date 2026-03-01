'use client';

export default function ConfirmModal({
  open,
  title = 'Confirmar exclusão',
  message,
  itemName,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'danger',
}) {
  if (!open) return null;
  return (
    <div
      className="confirm-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="confirm-modal-box">
        <h3 id="confirm-modal-title" className="confirm-modal-title">
          {title}
        </h3>
        {message && <p className="confirm-modal-message">{message}</p>}
        {itemName && (
          <p className="confirm-modal-item">
            <strong>{itemName}</strong>
          </p>
        )}
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={variant === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
