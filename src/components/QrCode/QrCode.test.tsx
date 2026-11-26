import { correction, generate } from 'lean-qr/nano'
import { expectNoA11yViolations } from '../../test/axe'
import { render, screen } from '../../test/utils'
import { QrCode } from './QrCode'
import { qrPath } from './qrPath'

describe('qrPath', () => {
  it('draws one square per dark module, shifted by the quiet zone', () => {
    // 2×2: dark on the diagonal
    const matrix = { size: 2, get: (x: number, y: number) => x === y }
    expect(qrPath(matrix, 4)).toBe('M4 4h1v1h-1zM5 5h1v1h-1z')
  })
})

describe('QrCode', () => {
  const message = `HB1.r.CeTjjoK3.${'A'.repeat(87)}`

  it('is an image with a name, sized to the code plus its quiet zone', () => {
    render(<QrCode value={message} label="Last message as a QR code" />)
    const image = screen.getByRole('img', { name: 'Last message as a QR code' })
    const { size } = generate(message, { minCorrectionLevel: correction.M })
    expect(image).toHaveAttribute('viewBox', `0 0 ${String(size + 8)} ${String(size + 8)}`)
  })

  it('draws exactly the modules lean-qr computed', () => {
    const { container } = render(<QrCode value={message} label="QR" />)
    const matrix = generate(message, { minCorrectionLevel: correction.M })
    let dark = 0
    for (let y = 0; y < matrix.size; y++) {
      for (let x = 0; x < matrix.size; x++) if (matrix.get(x, y)) dark++
    }
    const drawn = container.querySelector('path')?.getAttribute('d')?.split('M').length ?? 0
    // split('M') yields one empty string before the first square
    expect(drawn - 1).toBe(dark)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<QrCode value={message} label="QR" />)
    await expectNoA11yViolations(container)
  })
})
