import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/jetbrains-mono/700.css'
import './styles/global.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { activateLocale, detectLocale } from './i18n/locale'

const LOCALE_STORAGE_KEY = 'hushbind:locale'

/** localStorage throws in some private modes — a saved locale is optional anyway. */
function readSavedLocale(): string | null {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY)
  } catch {
    return null
  }
}

async function start(): Promise<void> {
  const root = document.getElementById('root')
  if (!root) throw new Error('#root element is missing in index.html')

  // Load messages before the first render: no flash of untranslated ids
  await activateLocale(detectLocale(readSavedLocale(), navigator.languages))

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
