import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from '../../test/axe'
import { render, screen, waitFor } from '../../test/utils'
import type { QrDecoder } from './decoders'
import { QrScanner } from './QrScanner'

/** A camera that "works": getUserMedia gives a stream whose track we can watch. */
function installCamera(getUserMedia?: () => Promise<MediaStream>) {
  const stopTrack = vi.fn()
  const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: getUserMedia ?? (() => Promise.resolve(stream)) },
  })
  return { stopTrack }
}

/** A decoder that "sees" these texts one frame after another, then nothing. */
function decoderSeeing(...frames: (string | null)[]) {
  const decoder: QrDecoder = {
    kind: 'jsqr',
    decode: () => Promise.resolve(frames.shift() ?? null),
  }
  return () => Promise.resolve(decoder)
}

const ours = (text: string) => text.startsWith('HB1.')

describe('QrScanner', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'mediaDevices')
  })

  it('explains when the browser has no camera API (http or old browser)', () => {
    const onCancel = vi.fn()
    render(<QrScanner onResult={vi.fn()} onCancel={onCancel} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/can’t use the camera/)
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })

  it('returns the first accepted code and turns the camera off', async () => {
    const { stopTrack } = installCamera()
    const onResult = vi.fn()
    render(
      <QrScanner
        onResult={onResult}
        onCancel={vi.fn()}
        accept={ours}
        decoderFactory={decoderSeeing(null, 'https://not-ours.example', 'HB1.c.abc')}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(/Point the camera/)
    await waitFor(
      () => {
        expect(onResult).toHaveBeenCalledWith('HB1.c.abc')
      },
      { timeout: 2000 },
    )
    expect(onResult).toHaveBeenCalledOnce()
    expect(stopTrack).toHaveBeenCalled()
  })

  it('says so when camera access is denied', async () => {
    installCamera(() => Promise.reject(new DOMException('no', 'NotAllowedError')))
    render(<QrScanner onResult={vi.fn()} onCancel={vi.fn()} decoderFactory={decoderSeeing()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/Camera access is off/)
  })

  it('says so when there is no camera', async () => {
    installCamera(() => Promise.reject(new DOMException('no', 'NotFoundError')))
    render(<QrScanner onResult={vi.fn()} onCancel={vi.fn()} decoderFactory={decoderSeeing()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/No camera found/)
  })

  it('turns the camera off when closed', async () => {
    const { stopTrack } = installCamera()
    const onCancel = vi.fn()
    const { unmount } = render(
      <QrScanner onResult={vi.fn()} onCancel={onCancel} decoderFactory={decoderSeeing()} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cancel scanning' }))
    expect(onCancel).toHaveBeenCalled()
    unmount()
    await waitFor(() => {
      expect(stopTrack).toHaveBeenCalled()
    })
  })

  it('has no accessibility violations', async () => {
    installCamera()
    const { container } = render(
      <QrScanner onResult={vi.fn()} onCancel={vi.fn()} decoderFactory={decoderSeeing()} />,
    )
    await expectNoA11yViolations(container)
  })
})
