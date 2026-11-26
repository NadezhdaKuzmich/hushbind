import { Trans, useLingui } from '@lingui/react/macro'
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { Button, ButtonLink } from '../../components/Button'
import type { PairingResult } from '../../lib/crypto'
import { toHref } from '../../router'
import { CompareStep, NameStep } from './FinishPairing'
import { MessageIn } from './MessageIn'
import { MessageOut } from './MessageOut'
import {
  joinWithInvite,
  receiveResponse,
  receiveReveal,
  RemotePairingError,
  startAsInitiator,
  type PairingProblem,
  type RemoteSession,
} from './remoteSession'
import styles from './RemotePairing.module.css'

type StopReason = 'mismatch' | 'expired' | 'keyChanged' | 'badKey' | 'failed'

/** Everything this phone can show during a two-phone pairing. */
type Flow =
  | { stage: 'preparing' }
  | { stage: 'waitInvite' }
  | { stage: 'session'; session: RemoteSession }
  | { stage: 'name'; result: PairingResult }
  | { stage: 'saved'; name: string }
  | { stage: 'stopped'; reason: StopReason }

/** Problems after which this pairing can't go on. The rest can be fixed by pasting again. */
const STOPPING: ReadonlySet<PairingProblem> = new Set(['expired', 'keyChanged', 'badKey'])

const nowSeconds = () => Date.now() / 1000

type Side = 'initiator' | 'responder'

const initialFlow = (side: Side): Flow =>
  side === 'initiator' ? { stage: 'preparing' } : { stage: 'waitInvite' }

/** A short key per screen, so focus moves exactly when the screen changes. */
function screenKey(flow: Flow): string {
  return flow.stage === 'session' ? `${flow.session.role}-${flow.session.step}` : flow.stage
}

/**
 * Pairing two real phones by passing three short messages. This phone keeps only its own
 * half, in memory; nothing is saved until both people say the check numbers match.
 */
// `side`, not `role`: a prop named `role` reads as an ARIA role to people and to the linter
export function RemotePairing({ side }: { side: Side }) {
  const { t } = useLingui()
  const [flow, setFlow] = useState<Flow>(() => initialFlow(side))
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const focusTarget = useRef<HTMLElement | null>(null)
  const firstScreen = useRef(true)
  const key = screenKey(flow)

  const focusHere = (node: HTMLElement | null) => {
    focusTarget.current = node
  }

  // Phone A makes its keys as soon as the screen opens (again after "Start again")
  useEffect(() => {
    if (side !== 'initiator') return
    let cancelled = false
    void startAsInitiator(nowSeconds()).then((session) => {
      if (!cancelled) setFlow({ stage: 'session', session })
    })
    return () => {
      cancelled = true
    }
  }, [side, attempt])

  // Layout effect: focus moves in the same commit, never a moment on <body>
  useLayoutEffect(() => {
    if (firstScreen.current) {
      firstScreen.current = false
      return
    }
    focusTarget.current?.focus()
  }, [key])

  function problemText(problem: PairingProblem): string {
    switch (problem) {
      case 'format':
        return t`That doesn’t look like a Hushbind pairing message. Copy all of it and try again.`
      case 'length':
        return t`The message looks cut off. Copy all of it and try again.`
      case 'version':
        return t`This message is from another version of Hushbind. Update the app on both phones.`
      case 'wrongKind':
        return t`This message is for a different step. Paste their newest message.`
      case 'otherSession':
        return t`This message belongs to a different pairing. Ask for the reply to your invite.`
      case 'expired':
      case 'keyChanged':
      case 'badKey':
        return ''
    }
  }

  /** Runs one protocol step on pasted text and moves on, or explains what went wrong. */
  async function receive(step: (now: number) => Promise<RemoteSession>) {
    let next: Flow
    try {
      next = { stage: 'session', session: await step(nowSeconds()) }
    } catch (cause) {
      if (cause instanceof RemotePairingError && !STOPPING.has(cause.problem)) {
        setError(problemText(cause.problem))
        return
      }
      const reason = cause instanceof RemotePairingError ? cause.problem : 'failed'
      next = { stage: 'stopped', reason: reason as StopReason }
    }
    // After `await`: wrap, so the new screen and the finished transition land together
    startTransition(() => {
      setError(null)
      setFlow(next)
    })
  }

  function restart() {
    setError(null)
    setFlow(initialFlow(side))
    setAttempt((count) => count + 1)
  }

  const finish = (result: PairingResult) => ({
    onMatch: () => {
      setFlow({ stage: 'name', result })
    },
    onMismatch: () => {
      setFlow({ stage: 'stopped', reason: 'mismatch' })
    },
  })

  const heading = (text: string) => (
    <h2 ref={focusHere} tabIndex={-1} className={styles.heading}>
      {text}
    </h2>
  )

  if (flow.stage === 'preparing') {
    return (
      <p role="status" className={styles.text}>
        <Trans>Preparing your invite…</Trans>
      </p>
    )
  }

  if (flow.stage === 'waitInvite') {
    return (
      <div className={styles.flow}>
        {heading(t`Paste the invite`)}
        <p className={styles.text}>
          <Trans>
            Ask the other person to start pairing and send you their invite, or show it on their
            screen.
          </Trans>
        </p>
        {/* key per step: same type at the same spot would keep the old text (pitfall 53) */}
        <MessageIn
          key="invite"
          label={t`Their invite`}
          error={error}
          onSubmit={(text) => receive((now) => joinWithInvite(text, now))}
        />
      </div>
    )
  }

  if (flow.stage === 'name') {
    return (
      <div className={styles.flow}>
        {heading(t`Name this contact`)}
        <NameStep
          result={flow.result}
          onSaved={(name) => {
            setFlow({ stage: 'saved', name })
          }}
        />
      </div>
    )
  }

  if (flow.stage === 'saved') {
    const { name } = flow
    return (
      <div className={styles.flow}>
        {heading(t`Paired with ${name}`)}
        <p className={styles.text}>
          <Trans>Now you can check each other’s calls. The secret stays on this phone.</Trans>
        </p>
        <ButtonLink href={toHref({ name: 'contacts' })}>
          <Trans>Go to contacts</Trans>
        </ButtonLink>
      </div>
    )
  }

  if (flow.stage === 'stopped') {
    return (
      <div className={styles.flow}>
        {heading(t`Pairing stopped`)}
        <p role="alert" className={styles.text}>
          {flow.reason === 'mismatch' && (
            <Trans>
              Nothing was saved. Different numbers mean someone may be in the middle. Pair again
              side by side.
            </Trans>
          )}
          {flow.reason === 'expired' && (
            <Trans>This pairing took more than 10 minutes. Nothing was saved. Start again.</Trans>
          )}
          {flow.reason === 'keyChanged' && (
            <Trans>
              Their key changed during pairing. Someone may be in the middle. Nothing was saved —
              pair again side by side.
            </Trans>
          )}
          {(flow.reason === 'badKey' || flow.reason === 'failed') && (
            <Trans>The pairing message was broken. Nothing was saved. Start again.</Trans>
          )}
        </p>
        <Button variant="secondary" onClick={restart}>
          <Trans>Start again</Trans>
        </Button>
      </div>
    )
  }

  const { session } = flow
  switch (session.step) {
    case 'waitResponse':
      return (
        <div className={styles.flow}>
          {heading(t`Send your invite`)}
          <p className={styles.text}>
            <Trans>
              Show or send this to the person you’re pairing with. It works once, for 10 minutes.
            </Trans>
          </p>
          <MessageOut key="invite" label={t`Your invite`} message={session.outgoing} />
          <MessageIn
            key="reply"
            label={t`Their reply`}
            error={error}
            onSubmit={(text) => receive((now) => receiveResponse(session, text, now))}
          />
        </div>
      )
    case 'waitReveal':
      return (
        <div className={styles.flow}>
          {heading(t`Send your reply`)}
          <MessageOut key="reply" label={t`Your reply`} message={session.outgoing} />
          <MessageIn
            key="reveal"
            label={t`Their last message`}
            error={error}
            onSubmit={(text) => receive((now) => receiveReveal(session, text, now))}
          />
        </div>
      )
    case 'compare':
      return (
        <div className={styles.flow}>
          {heading(t`Compare check numbers`)}
          {session.role === 'initiator' && (
            <MessageOut
              key="reveal"
              label={t`Send them this last message`}
              message={session.outgoing}
            />
          )}
          <CompareStep sas={session.result.sas} {...finish(session.result)} />
        </div>
      )
  }
}
