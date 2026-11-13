import React from 'react';
import './button.css';

export const Button = React.forwardRef(({
  className = '',
  variant = 'default',
  size = 'default',
  children,
  type = 'button',
  ...props
}, ref) => {
  const variantClass = `ui-btn-${variant}`;
  const sizeClass = size !== 'default' ? `ui-btn-${size}` : '';

  return (
    <button
      ref={ref}
      type={type}
      className={`ui-btn ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;

