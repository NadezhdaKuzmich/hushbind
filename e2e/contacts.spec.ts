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

  test('pair on this device, then a code from one contact checks out on the other', async ({
    page,
  }) => {
    await page.goto('/#/app/pair')
    await page.getByRole('button', { name: 'Start' }).click()
    await page.getByRole('button', { name: 'Send to phone B' }).click()
    await page.getByRole('button', { name: 'Send to phone A' }).click()
    await page.getByRole('button', { name: 'Send to phone B' }).click()
    await page.getByRole('button', { name: 'They match' }).click()
    await page.getByRole('button', { name: 'Save both contacts' }).click()
    await expect(page.getByRole('heading', { name: 'Saved two demo contacts' })).toBeVisible()

    // Phone A's code for phone B…
    await page.goto('/#/app')
    await page.getByRole('link', { name: 'My code for Demo phone B' }).click()
    const code = page.getByTestId('code')
    await expect(code).toHaveText(/\d{3} \d{3}/)
    const heard = await code.textContent()

    // …is what phone B accepts when it checks phone A
    await page.getByRole('link', { name: 'Back to contacts' }).click()
    await page.getByRole('link', { name: 'Check caller Demo phone A' }).click()
    await page.getByRole('textbox', { name: 'Code you hear' }).fill(heard ?? '')
    await page.getByRole('button', { name: 'Check', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Code matches' })).toBeVisible()
  })

  test('an attacker in the middle shows up as different check numbers', async ({ page }) => {
    await page.goto('/#/app/pair')
    await page.getByRole('checkbox', { name: 'Put an attacker in the middle' }).check()
    await page.getByRole('button', { name: 'Start' }).click()
    await page.getByRole('button', { name: 'Send to phone B' }).click()
    await page.getByRole('button', { name: 'Send to phone A' }).click()
    await page.getByRole('button', { name: 'Send to phone B' }).click()

    await page.getByRole('button', { name: 'They match' }).click()
    await expect(page.getByRole('alert')).toContainText('are different')
    await page.getByRole('button', { name: 'They don’t match' }).click()
    await expect(page.getByText(/Good catch/)).toBeVisible()
  })

  for (const [action, title] of [
    ['prove', 'Your code'],
    ['check', 'Check a caller'],
  ] as const) {
    test(`${action} screen for an unknown contact explains and links back`, async ({ page }) => {
      await page.goto(`/#/app/c/unknown-id/${action}`)
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
      await expect(page.getByText(/isn’t on this device/)).toBeVisible()

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])

      await page.getByRole('link', { name: 'Back to contacts' }).click()
      await expect(page.getByRole('heading', { level: 1, name: 'My contacts' })).toBeVisible()
    })
  }
})
