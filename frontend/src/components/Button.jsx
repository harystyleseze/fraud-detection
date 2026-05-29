import { Icon } from './Icon';

export function Button({ variant = 'secondary', size, icon, children, className = '', ...rest }) {
  const cls = ['btn', variant, size, className].filter(Boolean).join(' ');
  return (
    <button className={cls} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 15} />}
      {children}
    </button>
  );
}
