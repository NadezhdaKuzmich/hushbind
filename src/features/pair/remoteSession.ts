import {
  completeAsInitiator,
  completeAsResponder,
  decodeMessage,
  encodeMessage,
  PairingError,
  respondToPairing,
  sessionTag,
  startPairing,
  WireError,
  type Bytes,
  type InitiatorState,
  type PairingResult,
  type ResponderState,
  type WireMessage,
} from '../../lib/crypto'

/** An invite is good for 10 minutes (threat model T10). */
export const INVITE_TTL_SECONDS = 10 * 60

/** What went wrong, in terms the screen can explain. */
export type PairingProblem =
  | 'format'
  | 'version'
  | 'length'
  /** A valid message, but not the one expected at this step. */
  | 'wrongKind'
  /** A reply to a different pairing. */
  | 'otherSession'
  | 'expired'
  /** The revealed key doesn't match the commitment: someone may be in the middle. */
  | 'keyChanged'
  /** Not a valid point on the curve. */
  | 'badKey'

export class RemotePairingError extends Error {
  override name = 'RemotePairingError'
  readonly problem: PairingProblem

  constructor(problem: PairingProblem) {
    super(`Pairing failed: ${problem}`)
    this.problem = problem
  }
}

/** One phone's side of a pairing. Each phone keeps only its own half, in memory. */
export type RemoteSession =
  | {
      role: 'initiator'
      step: 'waitResponse'
      state: InitiatorState
      commitment: Bytes
      outgoing: string
      startedAt: number
    }
  | { role: 'initiator'; step: 'compare'; result: PairingResult; outgoing: string }
  | {
      role: 'responder'
      step: 'waitReveal'
      state: ResponderState
      tag: string
      outgoing: string
      startedAt: number
    }
  | { role: 'responder'; step: 'compare'; result: PairingResult }

type Waiting<R extends RemoteSession['role']> = Extract<
  RemoteSession,
  { role: R; step: `wait${string}` }
>
type Comparing<R extends RemoteSession['role']> = Extract<
  RemoteSession,
  { role: R; step: 'compare' }
>

function read<K extends WireMessage['kind']>(
  text: string,
  kind: K,
): Extract<WireMessage, { kind: K }> {
  let message: WireMessage
  try {
    message = decodeMessage(text)
  } catch (error) {
    if (error instanceof WireError) throw new RemotePairingError(error.reason)
    throw error
  }
  if (message.kind !== kind) throw new RemotePairingError('wrongKind')
  return message as Extract<WireMessage, { kind: K }>
}

function checkFresh(startedAt: number, now: number) {
  if (now - startedAt > INVITE_TTL_SECONDS) throw new RemotePairingError('expired')
}

/** Web Crypto rejects a point that is not on the curve; we name that, and pass the rest on. */
async function withKeyChecks<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (error) {
    if (error instanceof PairingError) throw new RemotePairingError('keyChanged')
    // By name, not instanceof: a DOMException from another realm (iframe, Node in tests)
    // is a different class with the same name
    if (error instanceof Error && error.name === 'DataError') throw new RemotePairingError('badKey')
    throw error
  }
}

/** Phone A, step 1: make the invite to send. `now` in Unix seconds. */
export async function startAsInitiator(now: number): Promise<Waiting<'initiator'>> {
  const { commitment, state } = await startPairing()
  return {
    role: 'initiator',
    step: 'waitResponse',
    state,
    commitment,
    outgoing: encodeMessage({ kind: 'invite', commitment }),
    startedAt: now,
  }
}

/** Phone B, step 2: read the invite, answer with its own public key. */
export async function joinWithInvite(text: string, now: number): Promise<Waiting<'responder'>> {
  const { commitment } = read(text, 'invite')
  const { publicKey, state } = await respondToPairing(commitment)
  const tag = sessionTag(commitment)
  return {
    role: 'responder',
    step: 'waitReveal',
    state,
    tag,
    outgoing: encodeMessage({ kind: 'response', tag, publicKey }),
    startedAt: now,
  }
}

/** Phone A, step 3: read B's key, get the check number, reveal own key. */
export async function receiveResponse(
  session: Waiting<'initiator'>,
  text: string,
  now: number,
): Promise<Comparing<'initiator'>> {
  const { tag, publicKey } = read(text, 'response')
  if (tag !== sessionTag(session.commitment)) throw new RemotePairingError('otherSession')
  checkFresh(session.startedAt, now)
  const { reveal, result } = await withKeyChecks(() =>
    completeAsInitiator(session.state, publicKey),
  )
  return {
    role: 'initiator',
    step: 'compare',
    result,
    outgoing: encodeMessage({ kind: 'reveal', tag, publicKey: reveal }),
  }
}

/** Phone B, step 4: check A's key against the commitment, get the check number. */
export async function receiveReveal(
  session: Waiting<'responder'>,
  text: string,
  now: number,
): Promise<Comparing<'responder'>> {
  const { tag, publicKey } = read(text, 'reveal')
  if (tag !== session.tag) throw new RemotePairingError('otherSession')
  checkFresh(session.startedAt, now)
  const result = await withKeyChecks(() => completeAsResponder(session.state, publicKey))
  return { role: 'responder', step: 'compare', result }
}
