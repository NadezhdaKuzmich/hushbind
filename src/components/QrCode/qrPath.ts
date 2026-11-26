/** Anything that can say whether the module at (x, y) is dark — e.g. a lean-qr bitmap. */
export interface QrMatrix {
  readonly size: number
  get: (x: number, y: number) => boolean
}

/**
 * One SVG path for all dark modules: `M x y h1 v1 h-1 z` per module, offset by the quiet zone.
 * A single path renders faster than hundreds of `<rect>`s and has no gaps between modules.
 */
export function qrPath(matrix: QrMatrix, quietZone: number): string {
  const parts: string[] = []
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (matrix.get(x, y)) parts.push(`M${String(x + quietZone)} ${String(y + quietZone)}h1v1h-1z`)
    }
  }
  return parts.join('')
}
