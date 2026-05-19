import type { EstatePropertyCloudinaryAsset } from "@/lib/api/admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildCloudinaryPreviewUrl } from "./utils/media";

type CloudinaryPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefixInput: string;
  onPrefixInputChange: (value: string) => void;
  resolvedPrefix: string;
  error: string;
  loading: boolean;
  assets: EstatePropertyCloudinaryAsset[];
  selectedUrls: string[];
  pageIndex: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onRefresh: () => void;
  onToggleSelection: (url: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onAddSelected: () => void;
};

export function CloudinaryPickerDialog({
  open,
  onOpenChange,
  prefixInput,
  onPrefixInputChange,
  resolvedPrefix,
  error,
  loading,
  assets,
  selectedUrls,
  pageIndex,
  hasPreviousPage,
  hasNextPage,
  onRefresh,
  onToggleSelection,
  onPreviousPage,
  onNextPage,
  onAddSelected,
}: CloudinaryPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-2 border-b">
          <DialogTitle>Pick From Cloudinary</DialogTitle>
          <DialogDescription>
            Select one or more images to add to the listing gallery.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-3 overflow-y-auto flex-1 min-h-0">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <input
              value={prefixInput}
              onChange={(e) => onPrefixInputChange(e.target.value)}
              placeholder="Folder prefix (optional), e.g. estate-properties/2026/"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-2 rounded-lg border text-sm font-medium whitespace-nowrap disabled:opacity-60"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {resolvedPrefix ? (
            <p className="text-xs text-gray-500">
              Showing prefix: <code>{resolvedPrefix}</code>
            </p>
          ) : null}

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {assets.map((asset, idx) => {
              const url = String(asset.secure_url || "").trim();
              if (!url) return null;
              const selected = selectedUrls.includes(url);
              return (
                <button
                  key={`${asset.asset_id || asset.public_id || url}-${idx}`}
                  type="button"
                  onClick={() => onToggleSelection(url)}
                  className={`text-left rounded-lg border overflow-hidden ${
                    selected
                      ? "border-blue-600 ring-2 ring-blue-200"
                      : "border-gray-200"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={buildCloudinaryPreviewUrl(url)}
                    alt={String(asset.public_id || `Cloudinary asset ${idx + 1}`)}
                    className="h-24 w-full object-cover bg-gray-100"
                    loading="lazy"
                  />
                  <div className="p-2">
                    <p className="text-[11px] font-medium text-gray-700 truncate">
                      {asset.public_id || "Untitled"}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {asset.width && asset.height
                        ? `${asset.width}x${asset.height}`
                        : "Image"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {!loading && assets.length === 0 && !error ? (
            <div className="rounded-lg border border-dashed p-4 text-xs text-gray-500">
              No Cloudinary images found for this view.
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-gray-600">
              Page: {pageIndex + 1} - Selected: {selectedUrls.length}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onPreviousPage}
                disabled={loading || !hasPreviousPage}
                className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-60"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={onNextPage}
                disabled={loading || !hasNextPage}
                className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-60"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-3 py-2 rounded-lg border text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onAddSelected}
                disabled={selectedUrls.length === 0}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
