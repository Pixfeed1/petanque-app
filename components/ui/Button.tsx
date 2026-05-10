import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-petanque-vert text-petanque-sable shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-[inset_0_-2px_0_rgba(0,0,0,0.2),0_4px_12px_rgba(45,85,48,0.22)] active:translate-y-0',
  secondary:
    'bg-petanque-sable text-petanque-vert-fonce border border-petanque-sable-bord hover:bg-petanque-sable-fonce',
  ghost:
    'bg-transparent text-petanque-vert-fonce hover:bg-petanque-vert-pale/60',
  destructive:
    'bg-transparent text-petanque-rouge border border-petanque-rouge hover:bg-petanque-rouge/10',
  link:
    'bg-transparent text-petanque-vert underline-offset-4 hover:underline px-0 py-0 h-auto',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-petanque-vert focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]'
    const width = fullWidth ? 'w-full' : ''
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${width} ${className}`}
        {...rest}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
