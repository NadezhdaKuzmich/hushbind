/** Reads the QR code (if any) currently visible in the camera preview. */
export interface QrDecoder {
  readonly kind: 'native' | 'jsqr'
  decode: (video: HTMLVideoElement) => Promise<string | null>
}

// Not in TypeScript's DOM types yet: only what we use
interface NativeDetector {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>
}
interface NativeDetectorClass {
  new (options: { formats: string[] }): NativeDetector
  getSupportedFormats: () => Promise<string[]>
}

/** Pure part of the jsQR path: RGBA pixels → text. Separate, so tests can feed it pixels. */
export async function decodePixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): Promise<string | null> {
  const { default: jsQR } = await import('jsqr')
  // Our codes are always dark on light: skipping inverted attempts halves the work
  return jsQR(pixels, width, height, { inversionAttempts: 'dontInvert' })?.data ?? null
}

// Enough pixels for a phone-held QR code; more only costs time on every frame
const MAX_FRAME_WIDTH = 640

function jsqrDecoder(): QrDecoder {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  return {
    kind: 'jsqr',
    async decode(video) {
      if (!context || video.videoWidth === 0) return null
      const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth)
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height)
      return decodePixels(data, width, height)
    },
  }
}

/**
 * The browser's own detector where it exists (Chrome on Android): faster, better in low light.
 * Everywhere else (Safari, Firefox) jsQR — plain JS, so no WebAssembly in our CSP.
 * jsQR is a separate chunk, downloaded only when someone opens the scanner.
 */
export async function createDecoder(): Promise<QrDecoder> {
  const Native = (globalThis as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector
  if (Native) {
    try {
      if ((await Native.getSupportedFormats()).includes('qr_code')) {
        const detector = new Native({ formats: ['qr_code'] })
        return {
          kind: 'native',
          decode: async (video) => (await detector.detect(video))[0]?.rawValue ?? null,
        }
      }
    } catch {
      // Present but broken (seen on some desktops): fall back quietly
    }
  }
  return jsqrDecoder()
}
