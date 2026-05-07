// frontend/components/Editor.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor as HugeRTEditor } from '@hugerte/hugerte-react';

// HugeRTE styles & essentials
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

const DRAFT_STORAGE_KEY = 'blogDraft';
const AUTO_SAVE_DELAY = 2000; // 2 seconds debounce

export default function Editor() {
  const [blogContent, setBlogContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('Ready');
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft on initial mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      setBlogContent(savedDraft);
      setSaveStatus('Draft loaded');
    }
  }, []);

  // Handle content changes with auto-save debounce
  const handleEditorChange = useCallback((content: string) => {
    setBlogContent(content);
    setSaveStatus('Unsaved changes');

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      localStorage.setItem(DRAFT_STORAGE_KEY, content);
      setSaveStatus('Auto-saved');
    }, AUTO_SAVE_DELAY);
  }, []);

  // Manual save
  const handleSaveDraft = () => {
    setIsSaving(true);
    localStorage.setItem(DRAFT_STORAGE_KEY, blogContent);
    setSaveStatus('Draft saved successfully');
    setTimeout(() => setIsSaving(false), 500);
  };

  // Publish handler (replace with your actual API call)
  const handlePublish = () => {
    if (!blogContent.trim()) {
      setSaveStatus('Error: Content cannot be empty');
      return;
    }
    setSaveStatus('Publishing...');
    // TODO: Replace with your actual POST request
    setTimeout(() => {
      setSaveStatus('Published successfully!');
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setBlogContent('');
    }, 1000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Dynamic status badge color
  const statusColor = saveStatus.includes('Error')
    ? 'bg-red-100 text-red-700'
    : saveStatus.includes('saved') || saveStatus.includes('loaded')
    ? 'bg-green-100 text-green-700'
    : saveStatus.includes('Unsaved') || saveStatus.includes('Publishing')
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-gray-100 text-gray-600';

  return (
    <div className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Create Your Blog Post</h2>
          <p className="text-sm text-gray-600">Rich text editor with formatting options</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${statusColor}`}>
          {saveStatus}
        </span>
      </div>

      {/* Editor */}
      <HugeRTEditor
        value={blogContent}
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
        onEditorChange={handleEditorChange}
      />

      {/* Footer Actions */}
      <div className="bg-gray-50 p-4 border-t border-gray-200 flex gap-3 justify-end">
        <button
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={handlePublish}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          Publish
        </button>
      </div>
    </div>
  );
}