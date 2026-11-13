import {
  completeAsInitiator,
  completeAsResponder,
  respondToPairing,
  startPairing,
  type Bytes,
  type InitiatorState,
  type PairingResult,
  type ResponderState,
} from '../../lib/crypto'

/**
 * How messages get from one phone to the other. Everything sent is public, and the
 * channel may be hostile (Dolev–Yao model: the network belongs to the attacker).
 * The demo has a direct channel and one with a man in the middle; step 4 adds QR codes.
 */
export interface Channel {
  readonly attacker: boolean
  /** Phone A's commitment → what phone B receives. */
  commitment: (fromA: Bytes) => Promise<Bytes>
  /** Phone B's public key → what phone A receives. */
  response: (fromB: Bytes) => Promise<Bytes>
  /** Phone A's revealed key → what phone B receives. */
  reveal: (fromA: Bytes) => Promise<Bytes>
}

export function directChannel(): Channel {
  return {
    attacker: false,
    commitment: (fromA) => Promise.resolve(fromA),
    response: (fromB) => Promise.resolve(fromB),
    reveal: (fromA) => Promise.resolve(fromA),
  }
}

/**
 * A man in the middle who pairs separately with each phone: as the responder towards A
 * and as the initiator towards B. Both pairings "work", but each phone ends up with a key
 * shared with the attacker, and the two SAS numbers differ. Only comparing them reveals it.
 */
export function attackerChannel(): Channel {
  let towardA: ResponderState | null = null
  let keyForA: Bytes | null = null
  let towardB: InitiatorState | null = null
  let keyFromB: Bytes | null = null

  return {
    attacker: true,
    async commitment(fromA) {
      const asResponder = await respondToPairing(fromA)
      towardA = asResponder.state
      keyForA = asResponder.publicKey
      // A fresh commitment of its own goes to B
      const asInitiator = await startPairing()
      towardB = asInitiator.state
      return asInitiator.commitment
    },
    // Not async (nothing to await), so errors go through Promise.reject: never throw (pitfall 29)
    response(fromB) {
      if (!keyForA) return Promise.reject(new Error('Out of order'))
      keyFromB = fromB
      return Promise.resolve(keyForA)
    },
    async reveal(fromA) {
      if (!towardA || !towardB || !keyFromB) throw new Error('Out of order')
      // A's reveal matches A's commitment, so the attacker's session with A completes
      await completeAsResponder(towardA, fromA)
      const toB = await completeAsInitiator(towardB, keyFromB)
      return toB.reveal
    },
  }
}

/** The protocol as steps. Each step is what both phones know at that point. */
export type Session =
  | { step: 'commit'; channel: Channel; a: InitiatorState; commitment: Bytes }
  | {
      step: 'respond'
      channel: Channel
      a: InitiatorState
      b: ResponderState
      response: Bytes
    }
  | {
      step: 'reveal'
      channel: Channel
      b: ResponderState
      aResult: PairingResult
      reveal: Bytes
    }
  | { step: 'compare'; channel: Channel; aResult: PairingResult; bResult: PairingResult }

/** The session at one step, e.g. `SessionAt<'compare'>`. */
export type SessionAt<S extends Session['step']> = Extract<Session, { step: S }>
type At<S extends Session['step']> = SessionAt<S>

/** Step 1, phone A: key pair + commitment. */
export async function begin(channel: Channel): Promise<At<'commit'>> {
  const { commitment, state } = await startPairing()
  return { step: 'commit', channel, a: state, commitment }
}

/** Step 2, phone B gets the commitment and answers with its public key. */
export async function deliverCommitment(session: At<'commit'>): Promise<At<'respond'>> {
  const received = await session.channel.commitment(session.commitment)
  const { publicKey, state } = await respondToPairing(received)
  return { step: 'respond', channel: session.channel, a: session.a, b: state, response: publicKey }
}

/** Step 3, phone A gets B's key: shared secret, SAS, and its own key to reveal. */
export async function deliverResponse(session: At<'respond'>): Promise<At<'reveal'>> {
  const received = await session.channel.response(session.response)
  const { reveal, result } = await completeAsInitiator(session.a, received)
  return { step: 'reveal', channel: session.channel, b: session.b, aResult: result, reveal }
}

/** Step 4, phone B checks the reveal against the commitment, then gets its SAS. */
export async function deliverReveal(session: At<'reveal'>): Promise<At<'compare'>> {
  const received = await session.channel.reveal(session.reveal)
  const bResult = await completeAsResponder(session.b, received)
  return { step: 'compare', channel: session.channel, aResult: session.aResult, bResult }
}
