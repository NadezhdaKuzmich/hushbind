import { FinalCta } from './FinalCta'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { Privacy } from './Privacy'
import { TryIt } from './TryIt'
import { WhyItWorks } from './WhyItWorks'

/** Landing page: sections in reading order. Layout (header/footer) lives in App. */
export function LandingPage() {
  return (
    <>
      <Hero />
      <TryIt />
      <HowItWorks />
      <WhyItWorks />
      <Privacy />
      <FinalCta />
    </>
  )
}
