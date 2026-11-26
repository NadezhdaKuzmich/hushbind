import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/** Copy a message on one phone… */
async function read(page: Page, label: string) {
  return page.getByRole('textbox', { name: label }).inputValue()
}

/** …and paste it on the other. */
async function paste(page: Page, label: string, text: string) {
  await page.getByRole('textbox', { name: label }).fill(text)
  await page.getByRole('button', { name: 'Continue' }).click()
}

test.describe('pairing two phones', () => {
  test('two separate browsers pair by text, then check each other', async ({ browser }) => {
    // Two contexts = two phones: separate IndexedDB, nothing shared but the text we pass
    const sonPhone = await browser.newContext()
    const momPhone = await browser.newContext()
    const son = await sonPhone.newPage()
    const mom = await momPhone.newPage()

    await son.goto('/#/app/pair')
    await son.getByRole('link', { name: 'Start pairing' }).click()
    await mom.goto('/#/app/pair/join')

    await expect(son.getByRole('textbox', { name: 'Your invite' })).toHaveValue(/^HB1\.c\./)
    await expect(son.getByRole('img', { name: 'QR code: Your invite' })).toBeVisible()
    await paste(mom, 'Their invite', await read(son, 'Your invite'))
    await paste(son, 'Their reply', await read(mom, 'Your reply'))
    await paste(mom, 'Their last message', await read(son, 'Send them this last message'))

    const number = /^\d{3} \d{3}$/
    const sonNumber = await son.getByText(number).textContent()
    await expect(mom.getByText(number)).toHaveText(sonNumber ?? '')

    for (const [page, name] of [
      [son, 'Mom'],
      [mom, 'Son'],
    ] as const) {
      await page.getByRole('button', { name: 'Numbers match' }).click()
      await page.getByRole('textbox', { name: 'Name for this contact' }).fill(name)
      await page.getByRole('button', { name: 'Save contact' }).click()
      await expect(page.getByRole('heading', { name: `Paired with ${name}` })).toBeVisible()
    }

    // Son reads his code; Mom types it on her phone
    await son.goto('/#/app')
    await son.getByRole('link', { name: 'My code for Mom' }).click()
    await expect(son.getByTestId('code')).toHaveText(/\d{3} \d{3}/)
    const heard = await son.getByTestId('code').textContent()

    await mom.goto('/#/app')
    await mom.getByRole('link', { name: 'Check caller Son' }).click()
    await mom.getByRole('textbox', { name: 'Code you hear' }).fill(heard ?? '')
    await mom.getByRole('button', { name: 'Check', exact: true }).click()
    await expect(mom.getByRole('heading', { name: 'Code matches' })).toBeVisible()

    await sonPhone.close()
    await momPhone.close()
  })

  test('a reply pasted into the wrong phone is explained', async ({ page }) => {
    await page.goto('/#/app/pair/join')
    // A well-formed reply (65-byte key) where an invite is expected
    await paste(page, 'Their invite', `HB1.k.abcdefgh.${'A'.repeat(87)}`)
    await expect(page.getByRole('alert')).toContainText('different step')

    await paste(page, 'Their invite', 'HB1.c.AAAA')
    await expect(page.getByRole('alert')).toContainText('cut off')
  })

  test('pairing screens have no WCAG A/AA violations', async ({ page }) => {
    for (const path of ['/#/app/pair', '/#/app/pair/start', '/#/app/pair/join']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(results.violations.map((v) => `${path} ${v.id}: ${v.help}`)).toEqual([])
    }
  })
})

test('the app refuses to run inside another page’s frame (T17)', async ({ page, baseURL }) => {
  await page.setContent(`<iframe title="embedded" src="${baseURL ?? ''}/#/app"></iframe>`)
  const frame = page.frameLocator('iframe')
  await expect(frame.getByRole('heading', { name: /can’t open inside another site/ })).toBeVisible()
  await expect(frame.getByRole('heading', { name: 'My contacts' })).toHaveCount(0)
})
