'use client';

import { useCognitiveLoad, type MemberCLData } from '@/src/hooks/queries/cognitive-load';

interface BandwidthMeterProps {
    workspaceId: string;
}

function MemberBar({ member }: { member: MemberCLData }) {
    const totalCw = member.total_cw ?? 0;
    const threshold = member.threshold ?? 10;
    const percent = Math.min(100, threshold > 0 ? (totalCw / threshold) * 100 : 0);
    const isOverloaded = totalCw >= threshold;
    const barColor = isOverloaded ? 'var(--color-danger, #e53e3e)' : 'var(--color-primary, #4f46e5)';

    return (
        <div className="bandwidth-meter__member">
            <div className="bandwidth-meter__member-header">
                <span className="bandwidth-meter__username">{member.username}</span>
                <div className="bandwidth-meter__badges">
                    {member.deep_work_protection && (
                        <span className="bandwidth-meter__dwp-badge" title="Deep Work Protection active">
                            🛡 DWP
                        </span>
                    )}
                    <span className="bandwidth-meter__cw-value">
                        {totalCw.toFixed(1)} / {threshold.toFixed(1)}
                    </span>
                </div>
            </div>
            <div className="bandwidth-meter__bar-track">
                <div
                    className="bandwidth-meter__bar-fill"
                    style={{ width: `${percent}%`, backgroundColor: barColor, transition: 'width 0.3s ease' }}
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            </div>
        </div>
    );
}

export function BandwidthMeter({ workspaceId }: BandwidthMeterProps) {
    const { data, isLoading, isError } = useCognitiveLoad(workspaceId);

    if (isLoading) {
        return (
            <div className="bandwidth-meter bandwidth-meter--loading">
                <div className="bandwidth-meter__title">Mental Bandwidth</div>
                <div className="bandwidth-meter__skeleton" />
            </div>
        );
    }

    if (isError || !data) {
        return null;
    }

    const members = data.members ?? [];

    if (members.length === 0) {
        return (
            <div className="bandwidth-meter">
                <div className="bandwidth-meter__title">Mental Bandwidth</div>
                <p className="bandwidth-meter__empty">No active members found.</p>
            </div>
        );
    }

    return (
        <div className="bandwidth-meter">
            <div className="bandwidth-meter__title">Mental Bandwidth</div>
            <div className="bandwidth-meter__list">
                {members.map((m) => (
                    <MemberBar key={m.user_id} member={m} />
                ))}
            </div>
        </div>
    );
}
