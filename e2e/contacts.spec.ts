import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('contacts', () => {
  test('opens the on-device vault and shows the empty state', async ({ page }) => {
    await page.goto('/#/app')
    await expect(page.getByText(/No contacts yet/)).toBeVisible()

    // The vault key was created on first open and survives a reload
    await page.reload()
    await expect(page.getByText(/No contacts yet/)).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('production build has no dev tools', async ({ page }) => {
    await page.goto('/#/app')
    await expect(page.getByText(/No contacts yet/)).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Developer tools' })).toHaveCount(0)
  })

  test('code screen for an unknown contact explains and links back', async ({ page }) => {
    await page.goto('/#/app/c/unknown-id/prove')
    await expect(page.getByRole('heading', { level: 1, name: 'Your code' })).toBeVisible()
    await expect(page.getByText(/isn’t on this device/)).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])

    await page.getByRole('link', { name: 'Back to contacts' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'My contacts' })).toBeVisible()
  })
})
