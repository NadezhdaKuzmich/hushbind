import { render, screen } from '../test/utils'
import { FramedNotice, isFramed } from './FramedNotice'

describe('frame guard', () => {
  it('detects being inside a frame', () => {
    const page = {}
    expect(isFramed({ top: page, self: page })).toBe(false)
    expect(isFramed({ top: {}, self: page })).toBe(true)
  })

  it('treats a top window it may not read as a frame', () => {
    const sandboxed = {
      self: {},
      get top(): unknown {
        throw new DOMException('Blocked', 'SecurityError')
      },
    }
    expect(isFramed(sandboxed)).toBe(true)
  })

  it('offers to open the app in its own tab', () => {
    render(<FramedNotice />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/can’t open inside/)
    const link = screen.getByRole('link', { name: 'Open Hushbind in a new tab' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
