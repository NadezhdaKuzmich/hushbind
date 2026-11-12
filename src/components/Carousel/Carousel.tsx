import { useLingui } from '@lingui/react/macro'
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { Icon } from '../Icon'
import styles from './Carousel.module.css'

export interface Slide {
  id: string
  /** Short name used in "Slide 2 of 4: <title>". */
  title: string
  content: ReactNode
}

export interface CarouselProps {
  slides: readonly Slide[]
  /** Accessible name of the carousel region. */
  label: string
  /** Auto-advance interval in ms. */
  interval?: number
  /** Start rotating on load (ignored with reduced motion). */
  autoPlay?: boolean
}

/** Horizontal distance in px that counts as a swipe. */
const SWIPE_THRESHOLD = 50

/**
 * Auto-rotating carousel per the WAI-ARIA APG pattern.
 * - Pause button comes first and is always visible (WCAG 2.2.2 Pause, Stop, Hide).
 * - Rotation pauses on hover and keyboard focus; it never starts with reduced motion.
 * - While rotating the region is `aria-live="off"`; when stopped it is `polite`,
 *   so manual changes are announced but automatic ones are not.
 * - Hidden slides are `inert`: links inside them can't be tabbed to.
 * - Touch swipe via Pointer Events; buttons stay the primary control.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
 */
export function Carousel({ slides, label, interval = 6000, autoPlay = true }: CarouselProps) {
  const { t } = useLingui()
  const id = useId()
  const reducedMotion = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [userPaused, setUserPaused] = useState(!autoPlay)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const swipeStartX = useRef<number | null>(null)

  const count = slides.length
  const playing = !userPaused && !reducedMotion
  const rotating = playing && !hovered && !focused

  const goTo = (next: number) => {
    setIndex(((next % count) + count) % count)
  }

  useEffect(() => {
    if (!rotating || count < 2) return
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % count)
    }, interval)
    return () => {
      window.clearTimeout(timer)
    }
  }, [rotating, index, interval, count])

  const style = { '--carousel-interval': `${String(interval)}ms` } as CSSProperties

  return (
    // Hover/focus only pause rotation (APG); they are not user actions on the region
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <section
      aria-roledescription={t`carousel`}
      aria-label={label}
      className={styles.carousel}
      style={style}
      onMouseEnter={() => {
        setHovered(true)
      }}
      onMouseLeave={() => {
        setHovered(false)
      }}
      onFocus={() => {
        setFocused(true)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      <div className={styles.controls}>
        {!reducedMotion && (
          <button
            type="button"
            className={styles.control}
            aria-label={playing ? t`Stop automatic slide show` : t`Start automatic slide show`}
            onClick={() => {
              setUserPaused(playing)
            }}
          >
            <Icon name={playing ? 'pause' : 'play'} size={18} />
          </button>
        )}
        <div className={styles.dots}>
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              className={styles.dot}
              aria-label={t`Slide ${String(i + 1)}: ${slide.title}`}
              aria-current={i === index ? 'true' : undefined}
              aria-controls={`${id}-slides`}
              onClick={() => {
                goTo(i)
              }}
            >
              <span className={styles.dotFill} data-running={rotating && i === index} />
            </button>
          ))}
        </div>
        <div className={styles.arrows}>
          <button
            type="button"
            className={styles.control}
            aria-label={t`Previous slide`}
            aria-controls={`${id}-slides`}
            onClick={() => {
              goTo(index - 1)
            }}
          >
            <Icon name="chevronLeft" size={18} />
          </button>
          <button
            type="button"
            className={styles.control}
            aria-label={t`Next slide`}
            aria-controls={`${id}-slides`}
            onClick={() => {
              goTo(index + 1)
            }}
          >
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
      </div>

      <div
        id={`${id}-slides`}
        className={styles.viewport}
        aria-live={rotating ? 'off' : 'polite'}
        onPointerDown={(event) => {
          swipeStartX.current = event.clientX
        }}
        onPointerUp={(event) => {
          const start = swipeStartX.current
          swipeStartX.current = null
          if (start === null) return
          const delta = event.clientX - start
          if (Math.abs(delta) < SWIPE_THRESHOLD) return
          goTo(delta < 0 ? index + 1 : index - 1)
        }}
      >
        <div className={styles.track} style={{ transform: `translateX(-${String(index * 100)}%)` }}>
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              role="group"
              aria-roledescription={t`slide`}
              aria-label={t`${String(i + 1)} of ${String(count)}: ${slide.title}`}
              className={styles.slide}
              aria-hidden={i !== index}
              inert={i !== index}
            >
              {slide.content}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
