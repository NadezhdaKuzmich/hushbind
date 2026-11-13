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
})
