type SubmitBarProps = {
  isSaving: boolean;
  isUploadingMedia: boolean;
  submitLabel: string;
  onSaveDraft: () => void;
};

export function SubmitBar({
  isSaving,
  isUploadingMedia,
  submitLabel,
  onSaveDraft,
}: SubmitBarProps) {
  const savingLabel = isUploadingMedia ? "Uploading..." : "Saving...";

  return (
    <div className="sticky bottom-4 bg-white border rounded-xl p-3 flex justify-end gap-2">
      <button
        type="button"
        onClick={onSaveDraft}
        disabled={isSaving}
        className="px-4 py-2 rounded-lg border text-sm font-semibold disabled:opacity-60"
      >
        {isSaving ? savingLabel : "Save Draft"}
      </button>
      <button
        type="submit"
        disabled={isSaving}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
      >
        {isSaving ? savingLabel : submitLabel}
      </button>
    </div>
  );
}
