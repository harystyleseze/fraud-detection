export function Avatar({ id, size = 26, fontSize = 10 }) {
  const text = (id || '?').replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize }}
    >
      {text}
    </span>
  );
}
