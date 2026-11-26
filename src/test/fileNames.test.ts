// Every file under src/ as Vite sees it; nothing gets imported
const files = Object.keys(import.meta.glob('/src/**/*'))

describe('file names', () => {
  it('stay unique on case-insensitive file systems (macOS, Windows)', () => {
    // RemotePairing.tsx next to remotePairing.ts: macOS imports the wrong one
    const seen = new Map<string, string>()
    const clashes: string[] = []
    for (const file of files) {
      const key = file.replace(/\.[^./]+$/, '').toLowerCase()
      const other = seen.get(key)
      if (other) clashes.push(`${other} ↔ ${file}`)
      else seen.set(key, file)
    }
    expect(clashes).toEqual([])
  })
})
