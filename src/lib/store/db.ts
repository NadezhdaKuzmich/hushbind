import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Sealed } from '../crypto'

/**
 * On-device database. Two stores:
 * - `keys`: the vault key as a non-extractable CryptoKey (IndexedDB keeps it as an opaque handle)
 * - `vault`: the encrypted vault blob
 *
 * @see https://github.com/jakearchibald/idb
 */
interface HushbindDB extends DBSchema {
  keys: { key: 'vault'; value: CryptoKey }
  vault: { key: 'main'; value: Sealed }
}

export type Db = IDBPDatabase<HushbindDB>

const DB_NAME = 'hushbind'
const DB_VERSION = 1

/** Opens (and on first run creates) the database. Bump DB_VERSION and migrate in `upgrade`. */
export function openDb(name = DB_NAME): Promise<Db> {
  return openDB<HushbindDB>(name, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('keys')
      db.createObjectStore('vault')
    },
  })
}
