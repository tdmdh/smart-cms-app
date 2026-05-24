import { useState } from 'react';
import { Trash2, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { useDeploymentEnvVars, useSetEnvVar, useDeleteEnvVar } from '@/src/hooks/queries/deployments/useDeployments';
import { Loader2 } from 'lucide-react';
import { getProviderDef } from './provider-configs/registry';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    useToast,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Form,
    FormGroup,
    FormRow,
} from '../shared/ui';

interface EnvVarsManagerProps {
    configId: string;
    /** Provider slug — controls which environment options are shown */
    provider?: 'vercel' | 'cloudflare' | 'gcp' | string;
}

export function EnvVarsManager({ configId, provider }: EnvVarsManagerProps) {
    const { data, isLoading } = useDeploymentEnvVars(configId);
    const setMutation = useSetEnvVar();
    const deleteMutation = useDeleteEnvVar();
    const toast = useToast();

    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [isSecret, setIsSecret] = useState(false);
    const [selectedEnvs, setSelectedEnvs] = useState<string[]>(['all']);
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const envOptions = getProviderDef(provider).envOptions;
    const showEnvSelector = envOptions.length > 0;

    const toggleEnv = (env: string) => {
        if (env === 'all') {
            setSelectedEnvs(['all']);
            return;
        }
        setSelectedEnvs(prev => {
            const without = prev.filter(e => e !== 'all');
            const next = without.includes(env) ? without.filter(e => e !== env) : [...without, env];
            return next.length === 0 ? ['all'] : next;
        });
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKey || !newValue) return;

        setMutation.mutate({
            configId,
            data: {
                key: newKey.toUpperCase(),
                value: newValue,
                is_secret: isSecret,
                environments: selectedEnvs,
            }
        }, {
            onSuccess: () => {
                setNewKey('');
                setNewValue('');
                setIsSecret(false);
                setSelectedEnvs(['all']);
                toast.success('Variable added');
            },
            onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to add variable'),
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteMutation.mutate({ configId, envVarId: deleteTarget }, {
            onSuccess: () => {
                toast.success('Variable deleted');
                setDeleteTarget(null);
            },
            onError: (err) => {
                toast.error(err instanceof Error ? err.message : 'Failed to delete variable');
                setDeleteTarget(null);
            },
        });
    };

    const toggleSecretVisibility = (id: string) => {
        setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (isLoading) {
        return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div>;
    }

    const envVars = data?.env_vars || [];

    return (
        <>
            <div className="space-y-6">
                <Card variant='transparent'>
                    <CardHeader title="Environment Variables" subtitle="Manage environment variables for your deployment." />
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
                                            type={isSecret ? "password" : "text"}
                                            placeholder="Value"
                                            className="font-mono"
                                            value={newValue}
                                            onChange={(e) => setNewValue(e.target.value)}
                                            rightAction={
                                                <button
                                                    type="button"
                                                    onClick={() => setIsSecret(!isSecret)}
                                                    className={`p-1 rounded hover:bg-slate-800 transition-colors ${isSecret ? 'text-yellow-500' : 'text-slate-400'}`}
                                                    title={isSecret ? "Secure variable" : "Plain text variable"}
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
                                <Button
                                    type="submit"
                                    disabled={!newKey || !newValue || setMutation.isPending}
                                    loading={setMutation.isPending}
                                    leftIcon="plus"
                                >
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
                                            No environment variables configured
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    envVars.map((env) => (
                                        <TableRow key={env.id} className="group">
                                            <TableCell className="font-mono text-sm text-slate-300">
                                                {env.key}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    {env.is_secret && !showSecrets[env.id] ? (
                                                        <span className="text-slate-600">••••••••••••••••</span>
                                                    ) : (
                                                        <span className="break-all">{env.value}</span>
                                                    )}
                                                    {env.is_secret && (
                                                        <button
                                                            onClick={() => toggleSecretVisibility(env.id)}
                                                            className="text-slate-500 hover:text-slate-300 transition-colors"
                                                        >
                                                            {showSecrets[env.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="xs"
                                                    variant="ghost"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400"
                                                    onClick={() => setDeleteTarget(env.id)}
                                                    disabled={deleteMutation.isPending}
                                                    iconOnly
                                                    leftIcon='trash'
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>
            </div>

            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Variable</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this environment variable? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={() => setDeleteTarget(null)}
                            disabled={deleteMutation.isPending}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn--danger"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
