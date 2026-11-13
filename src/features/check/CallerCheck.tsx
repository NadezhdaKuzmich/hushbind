import { Plural, Trans } from '@lingui/react/macro'
import {
  use,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type SubmitEvent,
} from 'react'
import { Button } from '../../components/Button'
import type { CheckResult } from '../../lib/crypto'
import type { Pair } from '../../lib/store'
import { usePairsStore } from '../pairs'
import styles from './CheckPage.module.css'

/** Everything the screen can show. One value at a time, never a mix. */
type View =
  | { step: 'ask' }
  | { step: 'invalid' }
  | { step: 'mismatch'; attemptsLeft: number }
  | { step: 'match' }
  | { step: 'locked'; unlocksAt: number }

const nowSeconds = () => Date.now() / 1000

function toView(result: CheckResult): View {
  switch (result.status) {
    case 'match':
      return { step: 'match' }
    case 'invalid':
      return { step: 'invalid' }
    case 'mismatch':
      return { step: 'mismatch', attemptsLeft: result.attemptsLeft }
    case 'locked':
      return { step: 'locked', unlocksAt: result.unlocksAt }
  }
}

/**
 * Type the code you hear; the screen never shows a code (threat model T2).
 * The verifier lives in the store, so leaving and reopening doesn't reset the tries.
 */
export function CallerCheck({ pair }: { pair: Pair }) {
  const store = usePairsStore()
  const { checkKey } = use(store.keysFor(pair))
  const verifier = store.verifierFor(pair.id, checkKey)
  const [view, setView] = useState<View>(() => {
    const unlocksAt = verifier.lockedUntil(nowSeconds())
    return unlocksAt === null ? { step: 'ask' } : { step: 'locked', unlocksAt }
  })
  const [isPending, startTransition] = useTransition()
  const input = useRef<HTMLInputElement>(null)
  const result = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)
  const inputId = useId()
  const feedbackId = useId()
  const tipId = useId()
  const name = pair.name

  // After each answer: back to the field to retype, or to the verdict heading.
  // Layout effect: focus moves in the same commit, never a moment on <body>
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (view.step === 'match' || view.step === 'locked') {
      result.current?.focus()
    } else {
      input.current?.focus()
      input.current?.select()
    }
  }, [view])

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = new FormData(event.currentTarget).get('code')
    startTransition(async () => {
      const checked = await verifier.check(typeof code === 'string' ? code : '', nowSeconds())
      setView(toView(checked))
    })
  }

  if (view.step === 'match') {
    return (
      <div className={[styles.verdict, styles.good].join(' ')}>
        <h2 ref={result} tabIndex={-1} className={styles.verdictTitle}>
          <Trans>Code matches</Trans>
        </h2>
        <p className={styles.text}>
          <Trans>
            The code came from {name}’s phone. If anything still feels wrong, hang up and call{' '}
            {name} back yourself.
          </Trans>
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            setView({ step: 'ask' })
          }}
        >
          <Trans>Check again</Trans>
        </Button>
      </div>
    )
  }

  if (view.step === 'locked') {
    const minutes = Math.max(1, Math.ceil((view.unlocksAt - nowSeconds()) / 60))
    return (
      <div role="alert" className={[styles.verdict, styles.bad].join(' ')}>
        <h2 ref={result} tabIndex={-1} className={styles.verdictTitle}>
          <Trans>This is probably not {name}</Trans>
        </h2>
        <p className={styles.text}>
          <Trans>
            Hang up. Call {name} back on the number you know — not the one that called you.
          </Trans>
        </p>
        <p className={styles.small}>
          <Plural
            value={minutes}
            one="Checking is paused for # minute."
            other="Checking is paused for # minutes."
          />
        </p>
      </div>
    )
  }

  const feedback =
    view.step === 'invalid' ? (
      <Trans>Type the 6 digits you hear.</Trans>
    ) : view.step === 'mismatch' ? (
      <Trans>
        Wrong code. <Plural value={view.attemptsLeft} one="# try left." other="# tries left." /> Ask{' '}
        {name} to read it again, slowly.
      </Trans>
    ) : null

  return (
    <>
      <p className={styles.text}>
        <Trans>Ask {name} to read their code, then type what you hear.</Trans>
      </p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label htmlFor={inputId} className={styles.label}>
          <Trans>Code you hear</Trans>
        </label>
        <div className={styles.row}>
          {/* autoComplete off, not one-time-code: the phone must not offer an SMS code here */}
          <input
            ref={input}
            id={inputId}
            name="code"
            className={styles.input}
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            maxLength={7}
            required
            aria-invalid={feedback ? true : undefined}
            aria-describedby={feedback ? `${feedbackId} ${tipId}` : tipId}
          />
          <Button type="submit" size="lg" disabled={isPending}>
            <Trans>Check</Trans>
          </Button>
        </div>
        {feedback && (
          <p id={feedbackId} role="alert" className={styles.feedback}>
            {feedback}
          </p>
        )}
      </form>
      <p id={tipId} className={styles.tip}>
        <Trans>
          A real {name} never refuses to read the code. “No time”, “the app is broken” — hang up and
          call them back on the number you know.
        </Trans>
      </p>
    </>
  )
}
