'use client';

import { useState } from 'react';

export default function ProfileView() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    return (
        <div className="sidebar-view__form">
            <div className="sidebar-view__field">
                <label htmlFor="profile-name">Name</label>
                <input
                    id="profile-name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
            <div className="sidebar-view__field">
                <label htmlFor="profile-email">Email</label>
                <input
                    id="profile-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="sidebar-view__field">
                <label htmlFor="profile-bio">Bio</label>
                <textarea
                    id="profile-bio"
                    placeholder="Tell us about yourself..."
                    rows={3}
                />
            </div>
        </div>
    );
}
