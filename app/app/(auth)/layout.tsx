'use client';

import { ColorBends } from "@/src/components/shared/effects";
import { BlurFadeGsap, Button } from "@/src/components/shared/ui";



export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <div className="auth-layout">
            <div className="auth-layout__header">
                <BlurFadeGsap direction="right" duration={0.25}>
                    <Button variant="link" size="md" href="/home" rightIcon={'arrow-right'} iconSize={16}>
                        Home
                    </Button>
                </BlurFadeGsap>
            </div>
            {/* <div className="auth-layout__background">
                <ColorBends
                    colors={["#071529", "#0b2545", "#8b1e2d"]}
                    rotation={0}
                    speed={0.3}
                    scale={1}
                    frequency={1}
                    warpStrength={1}
                    mouseInfluence={1}
                    parallax={0.1}
                    noise={0}
                    transparent
                    autoRotate={2}
                />
            </div> */}
            <BlurFadeGsap duration={0.25}>
                <main className="auth-layout__main">{children}</main>
            </BlurFadeGsap>
        </div>
    );
}

