import { render, screen } from '../test/utils'
import { SiteFooter } from './SiteFooter'

// Mutable stand-in for build-time config, so the test never depends on CI env
const config = vi.hoisted(() => ({ APP_NAME: 'Hushbind', REPO_URL: '' }))
vi.mock('../config', () => config)

describe('SiteFooter', () => {
  afterEach(() => {
    config.REPO_URL = ''
  })

  it('hides the source link when no repo URL is set', () => {
    render(<SiteFooter />)
    expect(screen.queryByRole('link', { name: 'Source code' })).not.toBeInTheDocument()
  })

  it('links to the repo in a new tab without leaking the opener', () => {
    config.REPO_URL = 'https://github.com/NadezhdaKuzmich/hushbind'
    render(<SiteFooter />)
    const link = screen.getByRole('link', { name: 'Source code' })
    expect(link).toHaveAttribute('href', config.REPO_URL)
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
