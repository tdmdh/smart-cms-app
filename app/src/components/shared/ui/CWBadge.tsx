'use client';

import { useState } from 'react';

interface CWBadgeProps {
    label: string;
    value: number;
    tooltip: string;
}

export function CWBadge({ label, value, tooltip }: CWBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <span
            className="cw-badge"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            title={tooltip}
            aria-label={`${label}: ${value.toFixed(1)}`}
        >
            <span className="cw-badge__label">{label}</span>
            <span className="cw-badge__value">{value.toFixed(1)}</span>
            {showTooltip && (
                <span className="cw-badge__tooltip" role="tooltip">
                    {tooltip}
                </span>
            )}
        </span>
    );
}
