import { Trans } from '@lingui/react/macro'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '../Button'
import { createDecoder, type QrDecoder } from './decoders'
import styles from './QrScanner.module.css'

export interface QrScannerProps {
  /** Called once with the first code that passes `accept`; the camera is already off then. */
  onResult: (text: string) => void
  onCancel: () => void
  /** Keep looking until this says yes, e.g. only our own messages. */
  accept?: (text: string) => boolean
  /** Injection point for tests; the app uses the real decoder. */
  decoderFactory?: () => Promise<QrDecoder>
}

type Problem = 'unsupported' | 'denied' | 'noCamera' | 'failed'

// ~4 tries a second: quick enough to feel instant, light enough for old phones
const SCAN_INTERVAL_MS = 250

function problemOf(error: unknown): Problem {
  // Read `name` from any object: a DOMException may come from another realm (pitfall 51)
  const name =
    typeof error === 'object' && error !== null && 'name' in error ? String(error.name) : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'noCamera'
  return 'failed'
}

const acceptAll = () => true

/** navigator.mediaDevices exists only on secure (https) pages. Known before the first render. */
function canUseCamera(): boolean {
  return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
}

/**
 * Camera preview that looks for a QR code. The camera turns off on success, on Cancel and
 * when the component unmounts — a forgotten stream keeps the camera light on.
 */
export function QrScanner({
  onResult,
  onCancel,
  accept = acceptAll,
  decoderFactory = createDecoder,
}: QrScannerProps) {
  const video = useRef<HTMLVideoElement>(null)
  const cancelButton = useRef<HTMLButtonElement>(null)
  const [problem, setProblem] = useState<Problem | null>(() =>
    canUseCamera() ? null : 'unsupported',
  )
  // Latest callbacks without restarting the camera when the parent re-renders
  const handlers = useRef({ onResult, accept })
  useEffect(() => {
    handlers.current = { onResult, accept }
  })

  // Layout effect: focus moves in the same commit, never a moment on <body>
  useLayoutEffect(() => {
    cancelButton.current?.focus()
  }, [])

  useEffect(() => {
    if (!canUseCamera()) return
    let stopped = false
    // A function, not the variable: after `await` TypeScript still assumes the value it saw
    // before, but stop() may have run in the meantime
    const isStopped = () => stopped
    let stream: MediaStream | null = null
    let timer: number | undefined

    function stop() {
      stopped = true
      window.clearTimeout(timer)
      for (const track of stream?.getTracks() ?? []) track.stop()
    }

    async function scan(decoder: QrDecoder) {
      const element = video.current
      if (isStopped() || !element) return
      const text = await decoder.decode(element).catch(() => null)
      if (isStopped()) return
      if (text && handlers.current.accept(text)) {
        stop()
        handlers.current.onResult(text)
        return
      }
      timer = window.setTimeout(() => void scan(decoder), SCAN_INTERVAL_MS)
    }

    async function start() {
      try {
        // Back camera on phones; any camera on laptops
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (isStopped() || !video.current) {
          stop()
          return
        }
        video.current.srcObject = stream
        await video.current.play()
        await scan(await decoderFactory())
      } catch (error) {
        if (!isStopped()) setProblem(problemOf(error))
        stop()
      }
    }

    void start()
    return stop
  }, [decoderFactory])

  return (
    <div className={styles.scanner}>
      {problem ? (
        <p role="alert" className={styles.problem}>
          {problem === 'unsupported' && (
            <Trans>This browser can’t use the camera here. Paste the text instead.</Trans>
          )}
          {problem === 'denied' && (
            <Trans>
              Camera access is off for this site. Allow it in the browser settings, or paste the
              text instead.
            </Trans>
          )}
          {problem === 'noCamera' && <Trans>No camera found. Paste the text instead.</Trans>}
          {problem === 'failed' && <Trans>The camera didn’t start. Paste the text instead.</Trans>}
        </p>
      ) : (
        <>
          {/* Decorative for screen readers: the status line says what to do */}
          <video ref={video} className={styles.preview} muted playsInline aria-hidden="true" />
          <p role="status" className={styles.hint}>
            <Trans>Point the camera at the QR code on the other phone.</Trans>
          </p>
        </>
      )}
      <Button ref={cancelButton} variant="secondary" onClick={onCancel}>
        {problem ? <Trans>Close</Trans> : <Trans>Cancel scanning</Trans>}
      </Button>
    </div>
  )
}
