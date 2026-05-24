"use client"

import { useRef, useState, useEffect } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

interface BlurFadeProps {
    children: React.ReactNode
    className?: string
    duration?: number
    delay?: number
    yOffset?: number
    xOffset?: number
    direction?: "up" | "down" | "left" | "right"
    inView?: boolean
    inViewMargin?: string
    blur?: string
}

export function BlurFade({
    children,
    className,
    duration = 0.4,
    delay = 0,
    yOffset = 6,
    xOffset = 6,
    direction = "down",
    inView = false,
    inViewMargin = "-50px",
    blur = "6px",
}: BlurFadeProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [shouldAnimate, setShouldAnimate] = useState(!inView)

    useEffect(() => {
        if (!inView || shouldAnimate) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldAnimate(true)
                    observer.disconnect()
                }
            },
            { rootMargin: inViewMargin }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => observer.disconnect()
    }, [inView, inViewMargin, shouldAnimate])

    useGSAP(() => {
        if (!shouldAnimate || !ref.current) return

        const initialVars: gsap.TweenVars = {
            opacity: 0,
            filter: `blur(${blur})`,
        }

        if (direction === "down") initialVars.y = -yOffset
        else if (direction === "up") initialVars.y = yOffset
        else if (direction === "left") initialVars.x = xOffset
        else if (direction === "right") initialVars.x = -xOffset

        gsap.fromTo(
            ref.current,
            initialVars,
            {
                opacity: 1,
                x: 0,
                y: 0,
                filter: "blur(0px)",
                duration,
                delay,
                ease: "power2.out",
                onComplete: () => {
                    gsap.set(ref.current, { clearProps: "filter" })
                }
            }
        )
    }, [shouldAnimate, direction, duration, delay, blur, yOffset, xOffset])

    return (
        <div ref={ref} className={className} style={{ opacity: 0 }}>
            {children}
        </div>
    )
}
