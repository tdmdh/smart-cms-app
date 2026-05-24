'use client';

import { User, Bell, Palette, Shield, ChevronRight } from 'lucide-react';
import { useAppDispatch } from '@/src/store/hooks';
import { pushView } from '@/src/store/slices/layoutSlice';

interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
}

function MenuItem({ icon, label, onClick }: MenuItemProps) {
    return (
        <button className="sidebar-view__menu-item" onClick={onClick}>
            <span className="sidebar-view__menu-icon">{icon}</span>
            <span className="sidebar-view__menu-label">{label}</span>
            <ChevronRight size={16} className="sidebar-view__menu-arrow" />
        </button>
    );
}

export default function SettingsView() {
    const dispatch = useAppDispatch();

    const handleOpenProfile = () => {
        dispatch(pushView({ view: 'profile', width: 'lg' }));
    };

    return (
        <div className="sidebar-view__menu">
            <MenuItem
                icon={<User size={18} />}
                label="Profile"
                onClick={handleOpenProfile}
            />
            <MenuItem
                icon={<Bell size={18} />}
                label="Notifications"
            />
            <MenuItem
                icon={<Palette size={18} />}
                label="Appearance"
            />
            <MenuItem
                icon={<Shield size={18} />}
                label="Security"
            />
        </div>
    );
}
