'use client';

import { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Form,
    FormGroup,
    FormRow,
    Input,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/src/components/shared/ui';
import { getProviderDef } from '../provider-configs/registry';

export type PendingEnvVar = {
    tempId: string;
    key: string;
    value: string;
    is_secret: boolean;
    environments: string[];
};

interface PendingEnvVarsEditorProps {
    provider?: string;
    envVars: PendingEnvVar[];
    onAdd: (entry: Omit<PendingEnvVar, 'tempId'>) => void;
    onRemove: (tempId: string) => void;
}

export function PendingEnvVarsEditor({ provider, envVars, onAdd, onRemove }: PendingEnvVarsEditorProps) {
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [isSecret, setIsSecret] = useState(false);
    const [selectedEnvs, setSelectedEnvs] = useState<string[]>(['all']);
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

    const envOptions = getProviderDef(provider).envOptions;
    const showEnvSelector = envOptions.length > 0;

    const toggleEnv = (env: string) => {
        if (env === 'all') { setSelectedEnvs(['all']); return; }
        setSelectedEnvs(prev => {
            const without = prev.filter(e => e !== 'all');
            const next = without.includes(env) ? without.filter(e => e !== env) : [...without, env];
            return next.length === 0 ? ['all'] : next;
        });
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKey || !newValue) return;
        onAdd({ key: newKey.toUpperCase(), value: newValue, is_secret: isSecret, environments: selectedEnvs });
        setNewKey('');
        setNewValue('');
        setIsSecret(false);
        setSelectedEnvs(['all']);
    };

    return (
        <Card variant="transparent">
            <CardHeader
                title="Environment Variables"
                subtitle="Variables will be set after the configuration is created."
            />
            <CardBody>
                <Form onSubmit={handleAdd}>
                    <FormGroup>
                        <FormRow>
                            <div className="flex-1">
                                <Input
                                    placeholder="KEY (e.g. API_URL)"
                                    className="font-mono uppercase"
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <Input
                                    type={isSecret ? 'password' : 'text'}
                                    placeholder="Value"
                                    className="font-mono"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    rightAction={
                                        <button
                                            type="button"
                                            onClick={() => setIsSecret(!isSecret)}
                                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${isSecret ? 'text-yellow-500' : 'text-slate-400'}`}
                                            title={isSecret ? 'Secure variable' : 'Plain text variable'}
                                        >
                                            {isSecret ? <Lock size={14} /> : <Unlock size={14} />}
                                        </button>
                                    }
                                />
                            </div>
                        </FormRow>
                    </FormGroup>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {showEnvSelector ? envOptions.map(env => (
                                <label key={env} className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={selectedEnvs.includes(env)}
                                        onChange={() => toggleEnv(env)}
                                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                                    />
                                    <span className="capitalize">{env}</span>
                                </label>
                            )) : (
                                <span className="text-xs text-slate-500">Applied to all environments</span>
                            )}
                        </div>
                        <Button type="submit" disabled={!newKey || !newValue} leftIcon="plus">
                            Add
                        </Button>
                    </div>
                </Form>

                <Table variant="compact">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/3">Key</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead className="w-16"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {envVars.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                                    No environment variables added
                                </TableCell>
                            </TableRow>
                        ) : (
                            envVars.map((v) => (
                                <TableRow key={v.tempId} className="group">
                                    <TableCell className="font-mono text-sm text-slate-300">{v.key}</TableCell>
                                    <TableCell className="font-mono text-sm text-slate-400">
                                        <div className="flex items-center gap-2">
                                            {v.is_secret && !showSecrets[v.tempId] ? (
                                                <span className="text-slate-600">••••••••••••••••</span>
                                            ) : (
                                                <span className="break-all">{v.value}</span>
                                            )}
                                            {v.is_secret && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSecrets(prev => ({ ...prev, [v.tempId]: !prev[v.tempId] }))}
                                                    className="text-slate-500 hover:text-slate-300 transition-colors"
                                                >
                                                    {showSecrets[v.tempId] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="xs"
                                            variant="ghost"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400"
                                            onClick={() => onRemove(v.tempId)}
                                            iconOnly
                                            leftIcon="trash"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardBody>
        </Card>
    );
}
