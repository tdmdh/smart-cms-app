"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/src/lib/utils"

const gradientPalette = [
    // Academic blues
    { from: '#134074', to: '#0b2545' },  // Yale blue to Prussian
    { from: '#1a5490', to: '#13315c' },  // Steel blue to Oxford navy
    { from: '#4a7fb0', to: '#134074' },  // Cerulean to Yale blue
    { from: '#8da9c4', to: '#1a5490' },  // Powder blue to Steel blue
    // Gold accents
    { from: '#d4af37', to: '#b8942e' },  // Classic gold
    { from: '#e6c864', to: '#d4af37' },  // Light gold to gold
    // Semantic colors
    { from: '#10b981', to: '#059669' },  // Success - emerald
    { from: '#f59e0b', to: '#d97706' },  // Warning - amber
    { from: '#ef4444', to: '#dc2626' },  // Error - red
    { from: '#4a7fb0', to: '#1a5490' },  // Info - cerulean
    // Slate neutrals
    { from: '#64748b', to: '#334155' },  // Slate 500 to 700
    { from: '#475569', to: '#1e293b' },  // Slate 600 to 800
    // Mixed combinations
    { from: '#134074', to: '#d4af37' },  // Navy to gold
]

function getGradientForUser(identifier: string): { from: string; to: string } {
    let hash = 0
    for (let i = 0; i < identifier.length; i++) {
        const char = identifier.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    const index = Math.abs(hash) % gradientPalette.length
    return gradientPalette[index]
}

function getInitials(name: string): string {
    if (!name) return '?'
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0])
    }
    return name.slice(0, 2)
}

function Avatar({
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
    return (
        <AvatarPrimitive.Root
            data-slot="avatar"
            className={cn(
                "relative flex size-8 shrink-0 overflow-hidden rounded-full",
                className
            )}
            {...props}
        />
    )
}

function AvatarGroup({
    children,
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
    return (
        <AvatarPrimitive.Root
            data-slot="avatar-group"
            className={cn(
                "group/avatar-group flex -space-x-5 *:data-[slot=avatar-group]:ring-2 *:data-[slot=avatar-group]:ring-background",
                className
            )}
            {...props}
        >
            {children}
        </AvatarPrimitive.Root>
    )
}

function AvatarGroupCount({
    className,
    style,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
    return (
        <AvatarPrimitive.Root
            data-slot="avatar-group-count"
            className={cn(
                // Layout & shape
                "relative flex shrink-0 items-center justify-center rounded-full",
                // Size variants via avatar-group context
                "size-8 group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6",
                // Icon size variants
                "[&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
                // Typography — $font-size-xs / $font-weight-bold
                "text-xs font-bold",
                className
            )}
            style={{
                // $academic-yale-blue → dark theme primary bg
                background: "linear-gradient(135deg, #134074 0%, #0b2545 100%)",
                // $text-dark → off-white text on dark bg
                color: "#f8fafc",
                ...style,
            }}
            {...props}
        />
    )
}

function AvatarImage({
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
    return (
        <AvatarPrimitive.Image
            data-slot="avatar-image"
            className={cn("aspect-square size-full", className)}
            {...props}
        />
    )
}

function AvatarFallback({
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
    return (
        <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className={cn(
                "bg-muted flex size-full items-center justify-center rounded-full",
                className
            )}
            {...props}
        />
    )
}

interface UserAvatarProps {
    name?: string
    email?: string
    username?: string
    avatarUrl?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

const sizeClasses = {
    xs: 'size-5 text-[10px]',
    sm: 'size-6 text-xs',
    md: 'size-8 text-sm',
    lg: 'size-10 text-xs',
    xl: 'size-12 text-sm',
}

function UserAvatar({ name, email, username, avatarUrl, size = 'md', className }: UserAvatarProps) {
    const displayName = name || username || email || 'Unknown'
    const identifier = name || username || email || 'user'
    const initials = getInitials(displayName)
    const gradient = getGradientForUser(identifier)

    const gradientStyle = {
        background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
    }

    return (
        <Avatar className={cn(sizeClasses[size], className)}>
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback style={gradientStyle} className="text-white font-medium">
                {initials}
            </AvatarFallback>
        </Avatar>
    )
}

export { Avatar, AvatarGroup, AvatarImage, AvatarFallback, UserAvatar, AvatarGroupCount }
