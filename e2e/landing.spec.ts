import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('landing', () => {
  test('loads without console errors or CSP violations', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1)
    expect(errors).toEqual([])
  })

  test('demo shows a live 6-digit code and switches scenarios', async ({ page }) => {
    await page.goto('/#try')
    const mine = page.getByRole('tabpanel').getByRole('group', { name: 'Code on your screen' })
    await expect(mine).toContainText(/\d{3} \d{3}/)

    await page.getByRole('tab', { name: 'Voice-clone scam' }).click()
    await expect(page.getByRole('tabpanel')).toContainText('Codes differ')
  })

  test('tabs work from the keyboard', async ({ page }) => {
    await page.goto('/#try')
    await page.getByRole('tab', { name: 'Real call' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: 'Voice-clone scam' })).toBeFocused()
    await expect(page.getByRole('tab', { name: 'Voice-clone scam' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  test('carousel does not auto-rotate with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/#how')
    await expect(page.getByRole('button', { name: /automatic slide show/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Slide 1: Pair once' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  for (const colorScheme of ['dark', 'light'] as const) {
    test(`has no WCAG A/AA violations (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
    })
  }
})
