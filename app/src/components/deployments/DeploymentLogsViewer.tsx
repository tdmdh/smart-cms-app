import { useEffect, useRef, useMemo } from 'react';
import { Terminal, Download, Clock } from 'lucide-react';
import type { DeploymentLogItem } from '@/src/api/deployments/config';
import { Button, Card, CardBody, CardHeader } from '../shared/ui';

interface DeploymentLogsViewerProps {
    logs: DeploymentLogItem[];
    isLoading: boolean;
    className?: string;
    status?: string;
}

export function DeploymentLogsViewer({ logs, isLoading, className = '', status }: DeploymentLogsViewerProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom if near bottom or initial load
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const getLevelColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'error': return 'text-red-400';
            case 'warn': return 'text-yellow-400';
            case 'info': return 'text-slate-300';
            case 'debug': return 'text-slate-500';
            default: return 'text-slate-300';
        }
    };

    const isActive = status && ['queued', 'cloning', 'building', 'deploying'].includes(status.toLowerCase());

    return (
        <Card className={`bg-slate-950 border-slate-800 flex flex-col overflow-hidden ${className}`}>
            <CardHeader className="py-2 px-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                    <Terminal size={14} />
                    <span>Build Logs</span>
                </div>
                <div className="flex items-center gap-3">
                    {isActive && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-400 animate-pulse">
                            <Clock size={12} />
                            <span>Live</span>
                        </div>
                    )}
                    <Button
                        size="xs"
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                        title="Download Logs"
                        disabled
                        iconOnly
                    >
                        <Download size={14} />
                    </Button>
                </div>
            </CardHeader>

            <CardBody className="p-0 flex-1 overflow-hidden relative">
                <div
                    className="absolute inset-0 overflow-y-auto p-4 font-mono text-xs md:text-sm space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                    ref={containerRef}
                >
                    {(!logs || logs.length === 0) && !isLoading ? (
                        <div className="text-slate-500 text-center py-8">
                            No logs available
                        </div>
                    ) : (
                        logs?.map((log) => (
                            <div key={log.id} className="flex gap-3 hover:bg-white/5 p-0.5 rounded px-1 group">
                                <div className="text-slate-600 w-20 shrink-0 select-none">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                                {log.phase && (
                                    <div className="text-blue-400/80 w-24 shrink-0 truncate select-none border-r border-white/5 mr-2">
                                        [{log.phase}]
                                    </div>
                                )}
                                <div className={`${getLevelColor(log.level)} break-all whitespace-pre-wrap flex-1`}>
                                    {log.message}
                                </div>
                            </div>
                        ))
                    )}

                    {isLoading && (
                        <div className="flex items-center gap-2 text-slate-500 pt-2 animate-pulse px-1">
                            <span className="w-2 h-4 bg-slate-500 block"></span>
                            <span>Loading logs...</span>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>
            </CardBody>
        </Card>
    );
}
