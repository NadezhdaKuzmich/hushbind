import { correction, generate } from 'lean-qr/nano'
import { qrPath } from './qrPath'
import styles from './QrCode.module.css'

export interface QrCodeProps {
  /** Text to encode. Public data only: anyone who sees the screen can read it. */
  value: string
  /** Accessible name, e.g. "Invite as a QR code". The text itself is shown next to it. */
  label: string
}

// Scanners expect a light margin of 4 modules around the code
const QUIET_ZONE = 4

/**
 * A QR code drawn as one SVG path from lean-qr's module matrix: no canvas, no `innerHTML`.
 * Always dark on light, in both themes: many scanners can't read inverted codes.
 * Medium error correction survives glare and a slightly blurry camera.
 *
 * @see https://github.com/davidje13/lean-qr
 * @example <QrCode value="HB1.c.…" label="Invite as a QR code" />
 */
export function QrCode({ value, label }: QrCodeProps) {
  const matrix = generate(value, { minCorrectionLevel: correction.M })
  const viewSize = matrix.size + QUIET_ZONE * 2
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${String(viewSize)} ${String(viewSize)}`}
      className={styles.qr}
      shapeRendering="crispEdges"
    >
      <rect width={viewSize} height={viewSize} className={styles.light} />
      <path d={qrPath(matrix, QUIET_ZONE)} className={styles.dark} />
    </svg>
  )
}
