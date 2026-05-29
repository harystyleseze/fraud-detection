export function Panel({ title, action, children, pad = false, className = '', ...rest }) {
  return (
    <div className={`panel ${className}`} {...rest}>
      {title && (
        <div className="panel-head">
          <h3>{title}</h3>
          {action && <div>{action}</div>}
        </div>
      )}
      {pad ? <div style={{ padding: 18 }}>{children}</div> : children}
    </div>
  );
}
