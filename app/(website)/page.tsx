import WebsiteHeader from '@/components/website/WebsiteHeader'
import Hero from '@/components/website/Hero'
import Intro from '@/components/website/Intro'
import CoreBelief from '@/components/website/CoreBelief'
import Services from '@/components/website/Services'
import Process from '@/components/website/Process'
import CaseStudies from '@/components/website/CaseStudies'
import Testimonials from '@/components/website/Testimonials'
import FinalCTA from '@/components/website/FinalCTA'
import WebsiteFooter from '@/components/website/WebsiteFooter'

export default function WebsiteHomePage() {
    return (
        <div className="relative overflow-x-hidden bg-paper text-ink">
            <WebsiteHeader />
            <main>
                <Hero />
                <Intro />
                <CoreBelief />
                <Services />
                <Process />
                <CaseStudies />
                <Testimonials />
                <FinalCTA />
            </main>
            <WebsiteFooter />
        </div>
    )
}
