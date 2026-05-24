'use client';

import { Mocks, Section } from "@/src/components/marketing";
import { BlurFade } from "@/src/components/shared/ui/BlurGsap";
import { useState } from "react";


export default function Home() {
  const [activeMockup, setActiveMockup] = useState<number>(1);

  return (
    <main className='page-home'>

      <Section>
        <div className='page-home__content__intro'>
          <BlurFade duration={0.5} delay={0.8} direction="down" blur="20px">
            <h1 className='page-home__content__intro--title'>One Platform to Run Your Content, Infrastructure, and Workflow</h1>
          </BlurFade>
          <BlurFade duration={0.5} delay={1.0} direction="down" blur="20px">
            <p className='page-home__content__intro--subtitle'>A secure, AI-powered CMS built for developers, teams, and enterprises to manage content, microservices, and collaboration in real time—without breaking existing workflows.</p>
          </BlurFade>
        </div>
        <aside className='page-home__content__aside'>
          <div className='page-home__content__aside--card'>
            {/* Image dummy */}
            <BlurFade duration={0.5} delay={1.2} direction="up" blur="20px">
            <div className='page-home__content__aside--card--image'></div>
            </BlurFade>
          </div>
        </aside>
      </Section>

      <Section className="page-home__features" >
        <div className='page-home__features__content__mockup--text'>
          <BlurFade duration={0.5} delay={0.4} direction="left" blur="20px" inView={true}>
            <div 
              className={`page-home__features__content__mockup--text-section ${activeMockup === 1 ? 'active' : ''}`}
              onMouseEnter={() => setActiveMockup(1)}
            >
              <h3>Content Management</h3>
              <p>Manage your content with ease using our intuitive dashboard. Create, edit, and publish content in real-time with powerful collaboration tools.</p>
            </div>
          </BlurFade>

          <BlurFade duration={0.5} delay={0.6} direction="left" blur="20px" inView={true}>
            <div 
              className={`page-home__features__content__mockup--text-section ${activeMockup === 2 ? 'active' : ''}`}
              onMouseEnter={() => setActiveMockup(2)}
            >
              <h3>AI-Powered Insights</h3>
              <p>Leverage AI to optimize your workflow. Get intelligent suggestions, automated tasks, and deep analytics to boost your productivity.</p>
            </div>
          </BlurFade>
        </div>
        <BlurFade duration={0.5} delay={0.4} direction="right" blur="20px" inView={true}>
          <aside className='page-home__features__content__mockup--wrapper'>
            {activeMockup === 1 && (
              <BlurFade key="mockup-1"  duration={0.25} direction="down" blur="20px"  inView={false}>
                <Mocks mode='simple' imageSrc="/mocks/dashboard.png" />
              </BlurFade>
            )}
            {activeMockup === 2 && (
              <BlurFade key="mockup-2" duration={0.25} direction="up" blur="20px" inView={false}>
                <Mocks mode='simple' imageSrc="/mocks/kanban.png" />
              </BlurFade>
            )}
          </aside>
        </BlurFade>
      </Section>
    </main>
  );
}