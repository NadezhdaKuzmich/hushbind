import { correction, generate } from 'lean-qr/nano'
import { createDecoder, decodePixels } from './decoders'

/** Draws a QR code into RGBA pixels the way a camera frame would hold it. */
function qrPixels(text: string, scale = 4, quiet = 4) {
  const matrix = generate(text, { minCorrectionLevel: correction.M })
  const side = (matrix.size + quiet * 2) * scale
  const pixels = new Uint8ClampedArray(side * side * 4).fill(255)
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.get(x, y)) continue
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const offset = (((y + quiet) * scale + dy) * side + (x + quiet) * scale + dx) * 4
          pixels.set([0, 0, 0, 255], offset)
        }
      }
    }
  }
  return { pixels, side }
}

describe('QR decoding', () => {
  it('reads back what our QrCode draws (lean-qr → jsQR round trip)', async () => {
    const message = `HB1.r.CeTjjoK3.${'B'.repeat(87)}`
    const { pixels, side } = qrPixels(message)
    await expect(decodePixels(pixels, side, side)).resolves.toBe(message)
  })

  it('returns null when there is no code in the frame', async () => {
    const blank = new Uint8ClampedArray(64 * 64 * 4).fill(255)
    await expect(decodePixels(blank, 64, 64)).resolves.toBeNull()
  })

  describe('createDecoder', () => {
    /** A stand-in for the browser's BarcodeDetector class. `function`: it's called with `new`. */
    function installDetector(formats: string[], found: string | null = null) {
      const detect = () => Promise.resolve(found === null ? [] : [{ rawValue: found }])
      Object.defineProperty(globalThis, 'BarcodeDetector', {
        configurable: true,
        value: Object.assign(
          function BarcodeDetector() {
            return { detect }
          },
          { getSupportedFormats: () => Promise.resolve(formats) },
        ),
      })
    }

    afterEach(() => {
      Reflect.deleteProperty(globalThis, 'BarcodeDetector')
    })

    it('uses jsQR when the browser has no BarcodeDetector', async () => {
      await expect(createDecoder()).resolves.toMatchObject({ kind: 'jsqr' })
    })

    it('prefers the native detector when it reads QR codes', async () => {
      installDetector(['qr_code'], 'HB1.c.x')
      const decoder = await createDecoder()
      expect(decoder.kind).toBe('native')
      await expect(decoder.decode(document.createElement('video'))).resolves.toBe('HB1.c.x')
    })

    it('falls back to jsQR when the native detector has no QR support', async () => {
      installDetector(['ean_13'])
      await expect(createDecoder()).resolves.toMatchObject({ kind: 'jsqr' })
    })
  })
})
