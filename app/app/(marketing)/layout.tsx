'use client';

import { Navigation } from "@/src/components/marketing/Navigation";
import { BlurFade, BlurFadeGsap } from "@/src/components/shared/ui";
import { ColorBends } from "@/src/components/shared/effects";
import Link from "next/link";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="marketing-layout">
            <div className="marketing-layout__background">
                <ColorBends
                    colors={["#071529", "#0b2545", "#8b1e2d"]}
                    rotation={35}
                    speed={0.5}
                    scale={1}
                    frequency={1}
                    warpStrength={1}
                    mouseInfluence={1}
                    parallax={0.1}
                    noise={0.1}
                    transparent
                    autoRotate={2}
                />
            </div>
            <BlurFadeGsap direction="down" delay={0.6} duration={0.4} blur="6px" className="marketing-layout__nav">
                <Navigation />
            </BlurFadeGsap>
            <main className="marketing-layout__main">{children}</main>
        </div>
    );
}

