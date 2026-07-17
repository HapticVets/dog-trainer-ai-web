"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const acceptedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

type DogProfilePhotoPickerProps = {
  dogName: string;
  statusLabel?: string;
  imageUrl?: string | null;
  pendingImage: File | null;
  pendingRemoval: boolean;
  disabled?: boolean;
  onChange: (image: File | null) => void;
  onRemove: () => void;
  onReset: () => void;
};

const optimizeImage = async (file: File) => {
  if (typeof createImageBitmap === "undefined") return file;

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));

  if (scale === 1 && file.type === "image/webp") {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.86)
  );

  return blob
    ? new File([blob], "dog-profile.webp", { type: "image/webp" })
    : file;
};

const createPreviewUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to preview image."));
    reader.readAsDataURL(file);
  });

export default function DogProfilePhotoPicker({
  dogName,
  statusLabel,
  imageUrl,
  pendingImage,
  pendingRemoval,
  disabled = false,
  onChange,
  onRemove,
  onReset,
}: DogProfilePhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const visibleImageUrl = pendingRemoval ? null : previewUrl ?? imageUrl ?? null;
  const isPendingChange = Boolean(pendingImage || pendingRemoval);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");

    if (!file) return;

    if (!acceptedMimeTypes.includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE_BYTES) {
      setError("Dog photos must be between 1 byte and 5 MB.");
      return;
    }

    try {
      const optimizedImage = await optimizeImage(file);
      setPreviewUrl(await createPreviewUrl(optimizedImage));
      onChange(optimizedImage);
    } catch {
      setError("This image could not be processed. Choose another JPEG, PNG, or WebP file.");
    }
  };

  return (
    <div className="border-b border-neutral-800 pb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-amber-500/30 bg-neutral-900 sm:h-28 sm:w-28">
          {visibleImageUrl ? (
            <Image
              src={visibleImageUrl}
              alt={`${dogName || "Dog"} profile photo`}
              fill
              sizes="(max-width: 640px) 96px, 112px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-black text-3xl font-bold text-amber-300">
              {dogName.trim().slice(0, 1).toUpperCase() || "K9"}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-bold text-white">{dogName || "New Dog"}</p>
            {statusLabel && (
              <span className="rounded-full border border-amber-500/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">
                {statusLabel}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-6 text-neutral-400">
            Optional profile photo. JPEG, PNG, or WebP up to 5 MB.
          </p>
          {error && <p className="mt-2 text-sm text-red-300" role="alert">{error}</p>}
          {isPendingChange && (
            <p className="mt-2 text-sm text-amber-300">Photo change will apply when you save the case file.</p>
          )}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Choose dog profile photo"
              disabled={disabled}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="rounded border border-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-900 disabled:opacity-50"
            >
              {visibleImageUrl ? "Replace photo" : "Choose photo"}
            </button>
            {visibleImageUrl && (
              <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                className="rounded border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-50"
              >
                Remove photo
              </button>
            )}
            {isPendingChange && (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setPreviewUrl(null);
                  onReset();
                }}
                disabled={disabled}
                className="rounded border border-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-900 disabled:opacity-50"
              >
                Cancel photo change
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
