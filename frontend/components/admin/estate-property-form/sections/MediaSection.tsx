type PendingUploadPreview = {
  file: File;
  key: string;
  previewUrl: string;
};

type MediaSectionProps = {
  galleryUrlInput: string;
  galleryUrls: string[];
  pendingUploads: File[];
  pendingUploadPreviews: PendingUploadPreview[];
  mediaError: string;
  videoUrl: string;
  onGalleryUrlInputChange: (value: string) => void;
  onAddGalleryUrl: () => void;
  onLocalUploads: (files: FileList | null) => void;
  onOpenCloudinaryPicker: () => void;
  onRemovePendingUpload: (index: number) => void;
  onMoveGalleryUrl: (index: number, direction: -1 | 1) => void;
  onRemoveGalleryUrl: (index: number) => void;
  onVideoUrlChange: (value: string) => void;
};

export function MediaSection({
  galleryUrlInput,
  galleryUrls,
  pendingUploads,
  pendingUploadPreviews,
  mediaError,
  videoUrl,
  onGalleryUrlInputChange,
  onAddGalleryUrl,
  onLocalUploads,
  onOpenCloudinaryPicker,
  onRemovePendingUpload,
  onMoveGalleryUrl,
  onRemoveGalleryUrl,
  onVideoUrlChange,
}: MediaSectionProps) {
  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      <h2 className="text-base font-semibold">Media</h2>
      <p className="text-xs text-gray-500">
        Add images by URL or upload. Uploaded files are stored through the
        backend storage (Cloudinary when configured). The first image is used as{" "}
        <code>featured_image_url</code>.
      </p>
      <div className="space-y-2">
        <span className="text-xs font-semibold text-gray-600">
          Add image URL
        </span>
        <div className="flex items-center gap-2">
          <input
            value={galleryUrlInput}
            onChange={(e) => onGalleryUrlInputChange(e.target.value)}
            placeholder="https://example.com/property-photo.jpg"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={onAddGalleryUrl}
            className="px-3 py-2 rounded-lg border text-sm font-medium"
          >
            Add
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <span className="text-xs font-semibold text-gray-600">
          Upload images
        </span>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => onLocalUploads(e.target.files)}
            className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
          />
          <button
            type="button"
            onClick={onOpenCloudinaryPicker}
            className="px-3 py-2 rounded-lg border text-sm font-medium whitespace-nowrap"
          >
            Pick from Cloudinary
          </button>
        </div>
        {pendingUploads.length > 0 ? (
          <div className="rounded-lg border p-2 space-y-1">
            <p className="text-xs font-semibold text-gray-600">
              Pending upload ({pendingUploads.length})
            </p>
            <ul className="space-y-1">
              {pendingUploadPreviews.map((item, idx) => (
                <li
                  key={item.key}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt={`Pending upload ${idx + 1}`}
                      className="h-10 w-14 rounded border object-cover bg-gray-100 shrink-0"
                    />
                    <span className="truncate">
                      {item.file.name} (
                      {Math.max(1, Math.round(item.file.size / 1024))}KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemovePendingUpload(idx)}
                    className="px-2 py-1 rounded border"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="space-y-2">
        <span className="text-xs font-semibold text-gray-600">
          Final gallery order ({galleryUrls.length + pendingUploads.length})
        </span>
        {galleryUrls.length > 0 ? (
          <ul className="space-y-2">
            {galleryUrls.map((url, idx) => (
              <li key={`${url}-${idx}`} className="rounded-lg border p-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Gallery image ${idx + 1}`}
                      className="h-12 w-16 rounded border object-cover bg-gray-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-xs text-gray-600 block">
                        {idx + 1}.{" "}
                        {idx === 0 ? "Featured image" : "Gallery image"}
                      </span>
                      <p className="mt-1 text-xs text-gray-700 break-all">
                        {url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onMoveGalleryUrl(idx, -1)}
                      disabled={idx === 0}
                      className="px-2 py-1 rounded border text-xs disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveGalleryUrl(idx, 1)}
                      disabled={idx === galleryUrls.length - 1}
                      className="px-2 py-1 rounded border text-xs disabled:opacity-40"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveGalleryUrl(idx)}
                      className="px-2 py-1 rounded border text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed p-3 text-xs text-gray-500">
            No URL images added yet.
          </div>
        )}
      </div>
      <label className="space-y-1 block">
        <span className="text-xs font-semibold text-gray-600">video_url</span>
        <input
          value={videoUrl}
          onChange={(e) => onVideoUrlChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </label>
      {mediaError ? <p className="text-xs text-red-600">{mediaError}</p> : null}
    </div>
  );
}
