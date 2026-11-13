import { Trans, useLingui } from '@lingui/react/macro'
import { useId, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { Button, ButtonLink } from '../../components/Button'
import type { PairingResult } from '../../lib/crypto'
import { formatCode } from '../../lib/totp'
import { toHref } from '../../router'
import { usePairsStore } from '../pairs'
import {
  attackerChannel,
  begin,
  deliverCommitment,
  deliverResponse,
  deliverReveal,
  directChannel,
  type Session,
  type SessionAt,
} from './localPairing'
import { NameForm } from './NameForm'
import styles from './PairDemo.module.css'
import { PhoneCard } from './PhoneCard'

/** Every screen of the demo. Protocol steps come straight from `Session`. */
type View =
  | { step: 'intro' }
  | Session
  /** Said "they match", but the numbers differ. */
  | { step: 'lookAgain'; session: SessionAt<'compare'> }
  | { step: 'caught'; attacker: boolean }
  | { step: 'failed' }
  | { step: 'name'; aResult: PairingResult; bResult: PairingResult }
  | { step: 'saved'; nameOnA: string; nameOnB: string }

const STEP_NUMBER: Partial<Record<View['step'], number>> = {
  commit: 1,
  respond: 2,
  reveal: 3,
  compare: 4,
  lookAgain: 4,
}

/**
 * Pairing two phones, both simulated on this screen. Each "Send" button stands for
 * scanning a QR code; in step 4 of the roadmap a real channel replaces `directChannel`.
 */
export function PairDemo() {
  const { t } = useLingui()
  const store = usePairsStore()
  const [view, setView] = useState<View>({ step: 'intro' })
  const [withAttacker, setWithAttacker] = useState(false)
  const [isPending, startTransition] = useTransition()
  const focusTarget = useRef<HTMLElement | null>(null)
  const firstRender = useRef(true)
  const questionId = useId()
  const attackerId = useId()

  // Each step's main control gets focus, so keyboard users can go Enter, Enter, Enter.
  // Layout effect: focus moves in the same commit, never a moment on <body>
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    focusTarget.current?.focus()
  }, [view.step])

  const focusHere = (node: HTMLElement | null) => {
    focusTarget.current = node
  }

  function advance(next: () => Promise<View>) {
    startTransition(async () => {
      let nextView: View
      try {
        nextView = await next()
      } catch {
        nextView = { step: 'failed' }
      }
      // After `await` an update is no longer part of the transition. Without this wrapper the
      // next step renders while isPending is still true, its button is disabled, and focus fails
      startTransition(() => {
        setView(nextView)
      })
    })
  }

  const restart = () => {
    setView({ step: 'intro' })
  }

  async function save(nameOnA: string, nameOnB: string, aResult: PairingResult, b: PairingResult) {
    // Phone A's list gets phone B (A's result), and the other way round
    await store.add(nameOnA, aResult)
    await store.add(nameOnB, b)
    setView({ step: 'saved', nameOnA: nameOnA.trim(), nameOnB: nameOnB.trim() })
  }

  const phoneA = t`Phone A`
  const phoneB = t`Phone B`
  const step = STEP_NUMBER[view.step]
  const session = view.step === 'lookAgain' ? view.session : view
  const attackerOn = 'channel' in session && session.channel.attacker

  return (
    <div className={styles.demo}>
      {/* Screen readers hear what just happened; sighted users see it in the cards */}
      <p role="status" className="visually-hidden">
        {step ? t`Step ${step} of 4.` : ''}
      </p>

      {view.step === 'intro' && (
        <>
          <p className={styles.text}>
            <Trans>
              Watch two phones pair, step by step, on this screen. You end up with two linked demo
              contacts to try “My code” and “Check caller”.
            </Trans>
          </p>
          <div className={styles.check}>
            <input
              id={attackerId}
              type="checkbox"
              checked={withAttacker}
              onChange={(event) => {
                setWithAttacker(event.target.checked)
              }}
            />
            <label htmlFor={attackerId}>
              <Trans>Put an attacker in the middle</Trans>
            </label>
          </div>
          <Button
            disabled={isPending}
            onClick={() => {
              advance(() => begin(withAttacker ? attackerChannel() : directChannel()))
            }}
          >
            <Trans>Start</Trans>
          </Button>
        </>
      )}

      {step !== undefined && (
        <>
          <p className={styles.stepper}>
            <Trans>Step {step} of 4</Trans>
          </p>
          {attackerOn && (
            <p className={styles.attacker}>
              <Trans>An attacker sits between the phones and swaps every message.</Trans>
            </p>
          )}
        </>
      )}

      {view.step === 'commit' && (
        <div className={styles.phones}>
          <PhoneCard
            title={phoneA}
            status={
              <Trans>
                Made a key pair and a commitment: a hash of its public key. The key itself stays
                hidden for now.
              </Trans>
            }
            message={{ label: t`Commitment`, bytes: view.commitment }}
            action={
              <Button
                ref={focusHere}
                disabled={isPending}
                onClick={() => {
                  advance(() => deliverCommitment(view))
                }}
              >
                <Trans>Send to phone B</Trans>
              </Button>
            }
          />
          <PhoneCard title={phoneB} status={<Trans>Waiting for phone A.</Trans>} waiting />
        </div>
      )}

      {view.step === 'respond' && (
        <div className={styles.phones}>
          <PhoneCard title={phoneA} status={<Trans>Waiting for phone B.</Trans>} waiting />
          <PhoneCard
            title={phoneB}
            status={<Trans>Kept the commitment and made its own key pair.</Trans>}
            message={{ label: t`Public key`, bytes: view.response }}
            action={
              <Button
                ref={focusHere}
                disabled={isPending}
                onClick={() => {
                  advance(() => deliverResponse(view))
                }}
              >
                <Trans>Send to phone A</Trans>
              </Button>
            }
          />
        </div>
      )}

      {view.step === 'reveal' && (
        <div className={styles.phones}>
          <PhoneCard
            title={phoneA}
            status={
              <Trans>
                Got phone B’s key, worked out the shared secret and its check number. Now it reveals
                its own key.
              </Trans>
            }
            sas={view.aResult.sas}
            message={{ label: t`Public key`, bytes: view.reveal }}
            action={
              <Button
                ref={focusHere}
                disabled={isPending}
                onClick={() => {
                  advance(() => deliverReveal(view))
                }}
              >
                <Trans>Send to phone B</Trans>
              </Button>
            }
          />
          <PhoneCard title={phoneB} status={<Trans>Waiting for phone A.</Trans>} waiting />
        </div>
      )}

      {(view.step === 'compare' || view.step === 'lookAgain') && (
        <>
          <div className={styles.phones}>
            <PhoneCard
              title={phoneA}
              status={<Trans>Ready.</Trans>}
              sas={session.step === 'compare' ? session.aResult.sas : null}
            />
            <PhoneCard
              title={phoneB}
              status={
                <Trans>
                  Checked that the revealed key matches the commitment, then worked out the shared
                  secret.
                </Trans>
              }
              sas={session.step === 'compare' ? session.bResult.sas : null}
            />
          </div>
          <section aria-labelledby={questionId} className={styles.question}>
            <h2 id={questionId} ref={focusHere} tabIndex={-1} className={styles.heading}>
              <Trans>Do the check numbers match?</Trans>
            </h2>
            <p className={styles.text}>
              <Trans>
                In real life you compare them out loud or on video. The same number on both phones
                means no one is in the middle.
              </Trans>
            </p>
            {view.step === 'lookAgain' && (
              <p role="alert" className={styles.error}>
                <Trans>
                  Look again: {formatCode(view.session.aResult.sas)} and{' '}
                  {formatCode(view.session.bResult.sas)} are different. Saving now would pair each
                  phone with the attacker.
                </Trans>
              </p>
            )}
            <div className={styles.actions}>
              <Button
                onClick={() => {
                  if (session.step !== 'compare') return
                  const { aResult, bResult } = session
                  setView(
                    aResult.sas === bResult.sas
                      ? { step: 'name', aResult, bResult }
                      : { step: 'lookAgain', session },
                  )
                }}
              >
                <Trans>They match</Trans>
              </Button>
              <Button
                variant="warning"
                onClick={() => {
                  setView({ step: 'caught', attacker: attackerOn })
                }}
              >
                <Trans>They don’t match</Trans>
              </Button>
            </div>
          </section>
        </>
      )}

      {view.step === 'name' && (
        <section aria-labelledby={questionId} className={styles.question}>
          <h2 id={questionId} className={styles.heading}>
            <Trans>Name each other</Trans>
          </h2>
          <NameForm
            firstField={focusHere}
            onSave={(nameOnA, nameOnB) => save(nameOnA, nameOnB, view.aResult, view.bResult)}
          />
        </section>
      )}

      {view.step === 'caught' && (
        <section aria-labelledby={questionId} className={styles.question}>
          <h2 id={questionId} ref={focusHere} tabIndex={-1} className={styles.heading}>
            <Trans>Pairing stopped</Trans>
          </h2>
          <p className={styles.text}>
            {view.attacker ? (
              <Trans>
                Good catch. An attacker was in the middle: each phone paired with the attacker, not
                with the other phone. Nothing was saved.
              </Trans>
            ) : (
              <Trans>
                Nothing was saved. If the numbers really differ, someone may be in the middle — pair
                again, side by side.
              </Trans>
            )}
          </p>
          <Button variant="secondary" onClick={restart}>
            <Trans>Start again</Trans>
          </Button>
        </section>
      )}

      {view.step === 'failed' && (
        <section aria-labelledby={questionId} className={styles.question}>
          <h2 id={questionId} ref={focusHere} tabIndex={-1} className={styles.heading}>
            <Trans>Pairing failed</Trans>
          </h2>
          <p className={styles.text}>
            <Trans>Something went wrong, and nothing was saved.</Trans>
          </p>
          <Button variant="secondary" onClick={restart}>
            <Trans>Start again</Trans>
          </Button>
        </section>
      )}

      {view.step === 'saved' && (
        <section aria-labelledby={questionId} className={styles.question}>
          <h2 id={questionId} ref={focusHere} tabIndex={-1} className={styles.heading}>
            <Trans>Saved two demo contacts</Trans>
          </h2>
          <p className={styles.text}>
            <Trans>
              Try them: open “My code” on “{view.nameOnA}” — that is what phone A reads out. Then
              open “Check caller” on “{view.nameOnB}” and type it in.
            </Trans>
          </p>
          <div className={styles.actions}>
            <ButtonLink href={toHref({ name: 'contacts' })}>
              <Trans>Go to contacts</Trans>
            </ButtonLink>
            <Button variant="secondary" onClick={restart}>
              <Trans>Pair again</Trans>
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
