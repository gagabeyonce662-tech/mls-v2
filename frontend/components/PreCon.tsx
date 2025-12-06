import React, { useRef, useState } from 'react';
import { uploadPreConnProperties } from '@/lib/api'; // adjust path to your helper

type Props = {
  authToken?: string | null;
  fieldName?: string;
  additionalFormFields?: Record<string, string>;
  maxGetSizeBytes?: number; // soft-limit for GET mode (warn)
  useGet?: boolean;         // default true per your request
  onSuccess?: (resp: any) => void;
  onError?: (err: any) => void;
};

export default function CSVUploadPreConn({
  authToken = null,
  fieldName = 'file',
  additionalFormFields = {},
  maxGetSizeBytes = 8 * 1024, // 8 KB warn threshold for GET (tweak as needed)
  useGet = true,
  onSuccess,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setStatus('Please select a .csv file');
      return;
    }
    setSelectedFile(f);
    setStatus(null);
    console.info('Selected CSV:', f.name, f.size);
    if (useGet && f.size > maxGetSizeBytes) {
      setStatus(`Warning: file is ${f.size} bytes — GET mode may fail due to URL length limits.`);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  async function upload() {
    if (!selectedFile) {
      setStatus('No file selected');
      return;
    }

    setUploading(true);
    setStatus(useGet ? 'Sending CSV via GET (query param)...' : 'Uploading via POST...');

    try {
      const resp = await uploadPreConnProperties(selectedFile, {
        fieldName,
        authToken: authToken ?? undefined,
        additionalFormFields,
        useGet,
      });

      console.info('Upload response:', resp);
      setStatus('Upload successful');
      onSuccess && onSuccess(resp);
    } catch (err: any) {
      console.error('Upload error:', err);
      const body = err?.body ?? null;
      setStatus(`Upload failed${body ? `: ${JSON.stringify(body)}` : ''}`);
      onError && onError(err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <label className="block text-sm font-medium mb-2">Upload CSV (pre-conn)</label>

      <div
        onDragOver={e => { e.preventDefault(); }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer"
        style={{ minHeight: 120 }}
      >
        <div className="text-center">
          <p className="text-sm">Drag & drop a CSV here, or click to select</p>
          <p className="text-xs text-gray-400 mt-1">
            Mode: {useGet ? 'GET (csv in query) — small files only' : 'POST (multipart/form-data) — recommended'}
          </p>
          {selectedFile && <p className="mt-2 text-sm font-medium">Selected: {selectedFile.name} ({selectedFile.size} bytes)</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={onInputChange}
      />

      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={upload}
          disabled={!selectedFile || uploading}
          className="px-4 py-2 rounded bg-purple-600 text-white disabled:opacity-50"
        >
          {uploading ? 'Sending...' : 'Upload'}
        </button>

        <button
          onClick={() => { setSelectedFile(null); setStatus(null); if (inputRef.current) inputRef.current.value = ''; }}
          className="px-3 py-2 rounded border"
        >
          Clear
        </button>
      </div>

      {status && <p className="mt-3 text-sm text-gray-700">{status}</p>}

      <div className="mt-3 text-xs text-gray-500">
        <p>Note: GET mode sends the CSV content inside the URL query parameter `csv`. This can fail for larger files.</p>
        <p>If you see errors like CORS, URL too long, or no server response — switch to <strong>POST</strong> mode (set <code>useGet=false</code>) or update the server to accept multipart uploads.</p>
      </div>
    </div>
  );
}
