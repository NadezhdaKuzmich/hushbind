import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('routing', () => {
  test('app screen opens by URL, and Back returns to the landing', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.goto('/#/app')
    await expect(page.getByRole('heading', { level: 1, name: 'My contacts' })).toBeVisible()
    await expect(page).toHaveTitle('My contacts · Hushbind')

    await page.goBack()
    await expect(page.getByRole('heading', { level: 1, name: /voice/i })).toBeVisible()
  })

  test('header link from an app screen scrolls to the landing section', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The header nav is hidden on narrow screens')
    await page.goto('/#/app')
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Privacy' })
      .click()
    await expect(page.locator('#privacy')).toBeInViewport()
  })

  test('unknown address shows a not-found page', async ({ page }) => {
    await page.goto('/#/does-not-exist')
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  })

  test('app screen has no WCAG A/AA violations', async ({ page }) => {
    await page.goto('/#/app')
    await expect(page.getByRole('heading', { level: 1, name: 'My contacts' })).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })
})
