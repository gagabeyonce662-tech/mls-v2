"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';

import MyNextEditor from "@/components/Editor";

export default function EditorPage() {
    return (
        <div>
            <h1>My Editor Page</h1>
            <MyNextEditor />
        </div>
    );
}