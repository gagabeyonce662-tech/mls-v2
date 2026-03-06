import React, { useRef, useState } from "react";
import { uploadPreConnProperties } from "@/lib/api"; // adjust path to your helper

type Props = {
  authToken?: string | null;
  fieldName?: string;
  additionalFormFields?: Record<string, string>;
  maxGetSizeBytes?: number; // soft-limit for GET mode (warn)
  useGet?: boolean; // default true per your request
  onSuccess?: (resp: any) => void;
  onError?: (err: any) => void;
};

export default function CSVUploadPreConn({
  authToken = null,
  fieldName = "file",
  additionalFormFields = {},
  maxGetSizeBytes = 8 * 1024, // 8 KB warn threshold for GET (tweak as needed)
  useGet = false,
  onSuccess,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualIds, setManualIds] = useState("");
  const [isManual, setIsManual] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setStatus("Please select a .csv file");
      return;
    }
    setSelectedFile(f);
    setStatus(null);
    console.info("Selected CSV:", f.name, f.size);
    if (useGet && f.size > maxGetSizeBytes) {
      setStatus(
        `Warning: file is ${f.size} bytes — GET mode may fail due to URL length limits.`,
      );
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
    let fileToUpload = selectedFile;

    if (isManual) {
      if (!manualIds.trim()) {
        setStatus("Please enter at least one listing ID");
        return;
      }

      // Convert manual IDs to a CSV Blob
      const ids = manualIds
        .split(/[\n,]+/)
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      if (ids.length === 0) {
        setStatus("No valid IDs found");
        return;
      }

      const csvContent = "listing_id\n" + ids.join("\n");
      fileToUpload = new File([csvContent], "manual_entry.csv", {
        type: "text/csv",
      });
    }

    if (!fileToUpload) {
      setStatus("No file selected or IDs entered");
      return;
    }

    setUploading(true);
    setStatus(
      useGet ? "Sending CSV via GET (query param)..." : "Uploading via POST...",
    );

    try {
      const resp = await uploadPreConnProperties(fileToUpload, {
        fieldName,
        authToken: authToken ?? undefined,
        additionalFormFields,
        useGet,
      });

      console.info("Upload response:", resp);
      setStatus("Upload successful");
      onSuccess && onSuccess(resp);
    } catch (err: any) {
      console.error("Upload error:", err);
      const body = err?.body ?? null;
      setStatus(`Upload failed${body ? `: ${JSON.stringify(body)}` : ""}`);
      onError && onError(err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <label className="block text-sm font-medium mb-2">
        Upload CSV (pre-conn)
      </label>

      <div className="flex border-b mb-4">
        <button
          onClick={() => {
            setIsManual(false);
            setStatus(null);
          }}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            !isManual
              ? "border-b-2 border-purple-600 text-purple-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          CSV File Upload
        </button>
        <button
          onClick={() => {
            setIsManual(true);
            setStatus(null);
          }}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            isManual
              ? "border-b-2 border-purple-600 text-purple-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Manual ID Entry
        </button>
      </div>

      {!isManual ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-colors"
          style={{ minHeight: 160 }}
        >
          <div className="text-center">
            <div className="mb-2 flex justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="Drawing 7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-sm font-medium">
              Drag & drop a CSV here, or click to select
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Mode:{" "}
              {useGet ? "GET (small files)" : "POST (recommended/multipart)"}
            </p>
            {selectedFile && (
              <p className="mt-3 text-sm font-semibold text-purple-600 px-3 py-1 bg-purple-50 rounded-full inline-block">
                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Enter Listing IDs
          </label>
          <textarea
            value={manualIds}
            onChange={(e) => setManualIds(e.target.value)}
            placeholder="Paste your listing IDs here, separated by commas or new lines..."
            className="w-full h-40 p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-sm font-mono"
          />
          <p className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            IDs will be automatically formatted and sent as a CSV internal file.
          </p>
        </div>
      )}

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
          disabled={(isManual ? !manualIds.trim() : !selectedFile) || uploading}
          className="px-4 py-2 rounded bg-purple-600 text-white disabled:opacity-50"
        >
          {uploading ? "Sending..." : "Upload"}
        </button>

        <button
          onClick={() => {
            setSelectedFile(null);
            setManualIds("");
            setStatus(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="px-3 py-2 rounded border hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
      </div>

      {status && <p className="mt-3 text-sm text-gray-700">{status}</p>}

      <div className="mt-3 text-xs text-gray-500">
        <p>
          Note: GET mode sends the CSV content inside the URL query parameter
          `csv`. This can fail for larger files.
        </p>
        <p>
          If you see errors like CORS, URL too long, or no server response —
          switch to <strong>POST</strong> mode (set <code>useGet=false</code>)
          or update the server to accept multipart uploads.
        </p>
      </div>
    </div>
  );
}
