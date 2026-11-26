import { writeFileSync } from 'node:fs'
import { correction, generate } from 'lean-qr/nano'

const WIDTH = 640
const HEIGHT = 480
const MODULE_PX = 8
const QUIET_ZONE = 4
const FRAMES = 15

/**
 * Writes a Y4M video of a QR code, for Chromium's fake camera
 * (`--use-file-for-fake-video-capture`). Y4M is a header plus raw frames: a brightness plane
 * (Y) and two colour planes at half size (U, V). Grey is enough, so U and V stay neutral.
 *
 * @see https://wiki.multimedia.cx/index.php/YUV4MPEG2
 */
export function writeQrVideo(text: string, file: string): void {
  const matrix = generate(text, { minCorrectionLevel: correction.M })
  const side = (matrix.size + QUIET_ZONE * 2) * MODULE_PX
  const left = Math.floor((WIDTH - side) / 2)
  const top = Math.floor((HEIGHT - side) / 2)

  // Video-range luma: 16 = black, 235 = white
  const luma = Buffer.alloc(WIDTH * HEIGHT, 235)
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.get(x, y)) continue
      for (let dy = 0; dy < MODULE_PX; dy++) {
        const row = top + (y + QUIET_ZONE) * MODULE_PX + dy
        const start = row * WIDTH + left + (x + QUIET_ZONE) * MODULE_PX
        luma.fill(16, start, start + MODULE_PX)
      }
    }
  }
  const chroma = Buffer.alloc((WIDTH / 2) * (HEIGHT / 2), 128)
  const frame = Buffer.concat([Buffer.from('FRAME\n'), luma, chroma, chroma])
  const header = Buffer.from(
    `YUV4MPEG2 W${String(WIDTH)} H${String(HEIGHT)} F30:1 Ip A1:1 C420jpeg\n`,
  )
  writeFileSync(file, Buffer.concat([header, ...Array<Buffer>(FRAMES).fill(frame)]))
}
