import type { ComponentChildren, JSX } from 'preact';

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-emerald bg-emerald text-white shadow-[4px_4px_0px_#1e8449] hover:bg-forest hover:border-forest',
  secondary: 'border-emerald bg-white text-emerald shadow-[4px_4px_0px_#ebf7ed] hover:bg-mint',
  quiet: 'border-transparent bg-transparent text-emerald hover:bg-mint',
  danger: 'border-rose-500 bg-white text-rose-600 shadow-[4px_4px_0px_#ffe4e6] hover:bg-rose-500 hover:text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-3.5 py-2 text-xs rounded-xl',
  md: 'min-h-11 px-5 py-2.5 text-sm rounded-xl',
  lg: 'min-h-12 px-6 py-3 text-sm rounded-xl',
};

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  block = false,
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
} = {}) {
  return [
    'ui-button inline-flex items-center justify-center gap-2 border-2 font-sharp font-bold no-underline',
    'transition-[transform,box-shadow,background-color,border-color,color] duration-150',
    'hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
    variantClasses[variant],
    sizeClasses[size],
    block ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');
}

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ComponentChildren;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

export function Button({ children, variant, size, block, class: className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} class={buttonClasses({ variant, size, block, className: String(className) })} {...props}>
      {children}
    </button>
  );
}

interface ButtonLinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ComponentChildren;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

export function ButtonLink({ children, variant, size, block, class: className = '', ...props }: ButtonLinkProps) {
  return (
    <a class={buttonClasses({ variant, size, block, className: String(className) })} {...props}>
      {children}
    </a>
  );
}

interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  label: string;
  children: ComponentChildren;
}

export function IconButton({ label, children, variant = 'secondary', class: className = '', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      class={buttonClasses({ variant, size: 'sm', className: `h-11 w-11 !p-0 shrink-0 ${className}` })}
      {...props}
    >
      {children}
    </button>
  );
}

interface IconLinkProps extends Omit<ButtonLinkProps, 'children'> {
  label: string;
  children: ComponentChildren;
}

export function IconLink({ label, children, variant = 'quiet', class: className = '', ...props }: IconLinkProps) {
  return (
    <a
      aria-label={label}
      title={label}
      class={buttonClasses({ variant, size: 'sm', className: `h-11 w-11 !p-0 shrink-0 ${className}` })}
      {...props}
    >
      {children}
    </a>
  );
}
