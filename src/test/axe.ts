import { act } from '@testing-library/react'
import axe from 'axe-core'

/**
 * Runs axe-core on rendered markup and fails the test on any violation.
 * Color contrast is checked in the browser (e2e): jsdom can't compute styles.
 * Inside `act`: axe can take over a second, and live screens (a ticking code) update meanwhile.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  let results: axe.AxeResults | undefined
  await act(async () => {
    results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    })
  })
  const summary = (results?.violations ?? []).map((v) => `${v.id}: ${v.help}`)
  expect(summary).toEqual([])
}
