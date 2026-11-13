import {
  fromBase64Url,
  generateVaultKey,
  open,
  randomBytes,
  seal,
  toBase64Url,
  type Bytes,
  type PairingResult,
  type PairingRole,
} from '../crypto'
import type { Db } from './db'

/** One person you are paired with. */
export interface Pair {
  /** Random id, never derived from the name or the secret. */
  id: string
  /** Label you chose, e.g. "Mom". Stays on this device. */
  name: string
  role: PairingRole
  /** Base64url pair secret. Only ever stored inside the encrypted vault. */
  secret: string
  createdAt: number
}

interface VaultData {
  pairs: Pair[]
}

const VAULT_CONTEXT = 'hushbind/v1/vault'
/** Longest contact name. The UI uses it for `maxLength`, so both sides agree. */
export const MAX_NAME_LENGTH = 40

function validName(name: string): string {
  const label = name.trim()
  if (!label || label.length > MAX_NAME_LENGTH) {
    throw new RangeError(`Name must be 1–${String(MAX_NAME_LENGTH)} characters`)
  }
  return label
}

/**
 * Encrypted list of pairs on this device.
 * Every write re-encrypts the whole vault with a fresh IV — the list is tiny, and
 * one blob is simpler and safer than per-record encryption.
 * Changes run one at a time (see `#exclusive`), so parallel calls never lose an update.
 */
export class VaultStore {
  readonly #db: Db
  readonly #key: CryptoKey
  #queue: Promise<unknown> = Promise.resolve()

  private constructor(db: Db, key: CryptoKey) {
    this.#db = db
    this.#key = key
  }

  /** Loads the vault key, creating it on first run. */
  static async open(db: Db): Promise<VaultStore> {
    let key = await db.get('keys', 'vault')
    if (!key) {
      key = await generateVaultKey()
      await db.put('keys', key, 'vault')
    }
    return new VaultStore(db, key)
  }

  private async read(): Promise<VaultData> {
    const sealed = await this.#db.get('vault', 'main')
    return sealed ? open<VaultData>(this.#key, sealed, VAULT_CONTEXT) : { pairs: [] }
  }

  private async write(data: VaultData): Promise<void> {
    await this.#db.put('vault', await seal(this.#key, data, VAULT_CONTEXT), 'main')
  }

  /**
   * Read-modify-write is not atomic: two parallel changes would both read the old list,
   * and the second write would drop the first change. The queue runs them in turn.
   */
  #exclusive<T>(change: () => Promise<T>): Promise<T> {
    const run = this.#queue.then(change)
    // A failed change must not block the ones after it
    this.#queue = run.catch(() => undefined)
    return run
  }

  async listPairs(): Promise<Pair[]> {
    return (await this.read()).pairs
  }

  /** Saves a finished pairing under a name. Returns the new pair. */
  async addPair(name: string, result: PairingResult): Promise<Pair> {
    const pair: Pair = {
      id: toBase64Url(randomBytes(16)),
      name: validName(name),
      role: result.role,
      secret: toBase64Url(result.pairSecret),
      createdAt: Date.now(),
    }
    await this.#exclusive(async () => {
      const data = await this.read()
      await this.write({ pairs: [...data.pairs, pair] })
    })
    return pair
  }

  async removePair(id: string): Promise<void> {
    await this.#exclusive(async () => {
      const data = await this.read()
      await this.write({ pairs: data.pairs.filter((pair) => pair.id !== id) })
    })
  }

  // `async` matters: an invalid name must reject the promise, not throw before returning it
  async renamePair(id: string, name: string): Promise<void> {
    const label = validName(name)
    await this.#exclusive(async () => {
      const data = await this.read()
      await this.write({
        pairs: data.pairs.map((pair) => (pair.id === id ? { ...pair, name: label } : pair)),
      })
    })
  }
}

/** Pair secret as bytes, for deriving directional keys. */
export function pairSecretBytes(pair: Pair): Bytes {
  return fromBase64Url(pair.secret)
}
