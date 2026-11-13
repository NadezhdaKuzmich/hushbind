import type { ComponentProps, ReactNode } from 'react'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'warning'
export type ButtonSize = 'md' | 'lg'

interface StyleProps {
  /** Visual weight. One `primary` per view keeps the main action obvious. */
  variant?: ButtonVariant
  /** `lg` for main calls to action and phone screens. */
  size?: ButtonSize
  /** Stretch to the container width. */
  fullWidth?: boolean
  children: ReactNode
}

function classes(variant: ButtonVariant, size: ButtonSize, fullWidth: boolean, extra?: string) {
  return [styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth, extra]
    .filter(Boolean)
    .join(' ')
}

// ComponentProps includes `ref`: in React 19 it is a plain prop, no forwardRef needed
export type ButtonProps = StyleProps & Omit<ComponentProps<'button'>, 'children'>

/**
 * An action on the current page. For navigation use {@link ButtonLink}.
 * Defaults to `type="button"` so it never submits a form by accident.
 *
 * @example <Button onClick={save}>Save</Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={classes(variant, size, fullWidth, className)} {...rest}>
      {children}
    </button>
  )
}

export type ButtonLinkProps = StyleProps & Omit<ComponentProps<'a'>, 'children'> & { href: string }

/**
 * Navigation that looks like a button. Renders a real `<a>`,
 * so it opens in a new tab and works without JavaScript.
 *
 * @example <ButtonLink href="#try">Try the demo</ButtonLink>
 */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <a className={classes(variant, size, fullWidth, className)} {...rest}>
      {children}
    </a>
  )
}
