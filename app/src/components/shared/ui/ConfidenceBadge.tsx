interface Props {
    score: number;
    size?: 'sm' | 'md';
}

export function ConfidenceBadge({ score, size = 'sm' }: Props) {
    const tier = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
    return (
        <span
            className={`confidence-badge confidence-badge--${tier} confidence-badge--${size}`}
            aria-label={`Confidence: ${score}%`}
        >
            {score}%
        </span>
    );
}
