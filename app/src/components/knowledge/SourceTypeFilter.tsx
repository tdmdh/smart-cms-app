'use client';

import { useArchetypes } from "@/src/hooks/queries/knowledge/archetypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../shared/ui";
import { useState } from "react";



interface SourceTypeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const SOURCE_TYPES = [
  { value: 'all', label: 'All sources' },
  { value: 'git', label: 'Git' },
  { value: 'task', label: 'Tasks' },
  { value: 'upload', label: 'Uploads' },
  { value: 'manual', label: 'Manual' },
];

const STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

interface FilterBarProps {
  sourceType: string;
  status: string;
  onSourceChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  projectId: string;
}

export function KnowledgeFilterBar({ sourceType, status, onSourceChange, onStatusChange, projectId }: FilterBarProps) {
  const [selectedArchetypeId, setSelectedArchetypeId] = useState('');
  const { data: archetypes = [] } = useArchetypes(projectId);
  return (
    <div className="knowledge-filters">
      <Select
        value={STATUSES.find(s => s.value === status) ? status : 'all'}
        onValueChange={onStatusChange}
      >
        <SelectTrigger className="knowledge-filters__select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={SOURCE_TYPES.find(s => s.value === sourceType) ? sourceType : 'all'}
        onValueChange={onSourceChange}
      >
        <SelectTrigger className="knowledge-filters__select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SOURCE_TYPES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {archetypes.length > 0 && (
        <Select
          value={selectedArchetypeId || '__none__'}
          onValueChange={(v) => setSelectedArchetypeId(v === '__none__' ? '' : v)}
        >
          <SelectTrigger aria-label="Select archetype for upload">
            <SelectValue placeholder="No archetype" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No archetype</SelectItem>
            {archetypes.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export default function SourceTypeFilter({ value, onChange }: SourceTypeFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="knowledge-filters__select">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SOURCE_TYPES.map((s) => (
          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
