import { Checkpoint, CheckpointResult } from '@/src/api/cosign';

interface Props {
    checkpoints: Checkpoint[];
    results: Record<string, CheckpointResult>;
}

const icons: Record<CheckpointResult, string> = {
    pass: '✓',
    fail: '✗',
    unknown: '○',
};

export function CheckpointList({ checkpoints, results }: Props) {
    if (checkpoints.length === 0) return null;

    return (
        <ul className="checkpoint-list">
            {checkpoints.map((cp) => {
                const result = results[cp.id] ?? 'unknown';
                return (
                    <li key={cp.id} className={`checkpoint-list__item checkpoint-list__item--${result}`}>
                        <span className="checkpoint-list__icon" aria-hidden="true">
                            {icons[result]}
                        </span>
                        <span>{cp.label}</span>
                    </li>
                );
            })}
        </ul>
    );
}
