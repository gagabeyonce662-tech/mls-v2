type JsonImportSectionProps = {
  jsonText: string;
  jsonError: string;
  onJsonTextChange: (value: string) => void;
  onApplyJsonPayload: () => void;
};

export function JsonImportSection({
  jsonText,
  jsonError,
  onJsonTextChange,
  onApplyJsonPayload,
}: JsonImportSectionProps) {
  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      <h2 className="text-base font-semibold">Paste JSON</h2>
      <p className="text-xs text-gray-500">
        Paste one listing JSON object to auto-fill matching fields.
      </p>
      <textarea
        value={jsonText}
        onChange={(e) => onJsonTextChange(e.target.value)}
        rows={8}
        placeholder='{"listing_key":"EST-1001","unparsed_address":"123 Main St","city":"Toronto","list_price":950000}'
        className="w-full rounded-lg border px-3 py-2 text-xs font-mono"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onApplyJsonPayload}
          className="px-3 py-2 rounded-lg border text-sm font-medium"
        >
          Apply JSON
        </button>
        {jsonError ? (
          <span className="text-xs text-red-600">{jsonError}</span>
        ) : null}
      </div>
    </div>
  );
}
