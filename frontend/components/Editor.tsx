// frontend/components/Editor.tsx

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@hugerte/hugerte-react';

// HugeRTE ke styles aur essentials load karein
import 'hugerte/hugerte';
import 'hugerte/models/dom';
import 'hugerte/themes/silver';
import 'hugerte/icons/default';
import 'hugerte/skins/ui/oxide/skin.js';
import 'hugerte/plugins/lists';
import 'hugerte/plugins/link';
import 'hugerte/plugins/image';
import 'hugerte/plugins/table';
import 'hugerte/plugins/code';
import 'hugerte/plugins/fullscreen';
import 'hugerte/plugins/help';
import 'hugerte/plugins/wordcount';
import 'hugerte/plugins/preview';
const MyNextEditor = () => {
    const [blogContent, setBlogContent] = useState('');
    const [saveStatus, setSaveStatus] = useState('All changes saved');

    // load draft on initial mount
    useEffect(() => {
        const savedDraft = localStorage.getItem('blogDraft');
        if (savedDraft) {
            setBlogContent(savedDraft);
            setSaveStatus('Draft loaded');
        }
    }, []);

    return (
        <div className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg border border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Create Your Blog Post</h2>
                <p className="text-sm text-gray-600">Rich text editor with formatting options</p>
            </div>

            <Editor
                initialValue="<p>Do your thing</p>"
                init={{
                    height: 500,
                    menubar: true,
                    plugins: [
                        'lists', 'link', 'image', 'table', 'code',
                        'fullscreen', 'help', 'wordcount', 'preview',
                    ],
                    toolbar: `
                        undo redo | formatselect | 
                        bold italic underline strikethrough | 
                        forecolor backcolor | 
                        alignleft aligncenter alignright alignjustify | 
                        bullist numlist outdent indent | 
                        removeformat | link image table | code fullscreen
                    `,
                    skin: 'oxide',
                    content_css: 'default',
                    branding: false,
                }}
                onEditorChange={(content) => setBlogContent(content)}
            />

            <div className="bg-gray-50 p-4 border-t border-gray-200 flex gap-3">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    Publish
                </button>
                <button className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">
                    Save Draft
                </button>
            </div>
        </div>
    );
};

export default MyNextEditor;