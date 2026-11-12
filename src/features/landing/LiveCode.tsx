import { Plural } from '@lingui/react/macro'
import { Suspense, use } from 'react'
import { CodeDisplay, type CodeDisplayProps } from '../../components/CodeDisplay'
import { useTotpCode } from '../../hooks/useTotpCode'
import { getDemoKey, type DemoKeyName } from './demoKeys'

export interface LiveCodeProps extends Pick<CodeDisplayProps, 'label' | 'tone' | 'size'> {
  /** Which demo secret produces the code. */
  keyName: DemoKeyName
}

function LiveCodeInner({ keyName, ...display }: LiveCodeProps) {
  const key = use(getDemoKey(keyName))
  const { code, secondsLeft } = useTotpCode(key)
  const countdown = (
    <Plural value={secondsLeft} one="Changes in # second" other="Changes in # seconds" />
  )
  return (
    <CodeDisplay code={code} secondsLeft={secondsLeft} countdownLabel={countdown} {...display} />
  )
}

/**
 * A real, ticking TOTP code from a demo secret.
 * Suspends while Web Crypto imports the key; the fallback keeps the same size, so no layout shift.
 */
export function LiveCode(props: LiveCodeProps) {
  const { label, tone, size } = props
  return (
    <Suspense
      fallback={
        <CodeDisplay
          code={null}
          secondsLeft={30}
          countdownLabel=""
          label={label}
          {...(tone && { tone })}
          {...(size && { size })}
        />
      }
    >
      <LiveCodeInner {...props} />
    </Suspense>
  )
}
