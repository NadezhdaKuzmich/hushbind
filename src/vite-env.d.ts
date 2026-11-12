/// <reference types="vite/client" />

// Typed env: a typo in a variable name becomes a compile error
interface ImportMetaEnv {
  readonly VITE_REPO_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
