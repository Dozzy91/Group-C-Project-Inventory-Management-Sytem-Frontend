export default function Modal({ children, onClose }) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card modal-card">{children}</div>
    </div>
  );
}
