"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';

const MyNextEditor = dynamic(() => import('@/components/Editor'), {
    ssr: false,
});

export default function EditorPage() {
    return (
        <div>
            <h1>My Editor Page</h1>
            <MyNextEditor />
        </div>
    );
}