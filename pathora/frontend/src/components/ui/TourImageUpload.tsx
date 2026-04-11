"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/* ── ExistingThumbnailPreview ────────────────────────────────── */
interface ExistingThumbnailPreviewProps {
  url: string;
  t: (key: string, fallback: string) => string;
  onReplace: () => void;
  onRemove: () => void;
  thumbnailError?: string;
  onThumbnailError?: (message: string) => void;
}

function ExistingThumbnailPreview({
  url,
  t,
  onReplace,
  onRemove,
  thumbnailError,
  onThumbnailError,
}: ExistingThumbnailPreviewProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative group">
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-[var(--border)] shadow-sm">
        {imgError ? (
          <div className="absolute inset-0 bg-[var(--muted)] flex items-center justify-center">
            <Icon icon="heroicons:photo" className="size-12 text-[var(--text-muted)]" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Existing thumbnail"
            className="w-full h-full object-cover"
            onError={() => {
              setImgError(true);
              onThumbnailError?.(t("tourAdmin.validation.thumbnailImageLoadError", "Thumbnail image could not be loaded"));
            }}
          />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
            <button
              type="button"
              onClick={onReplace}
              className="flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white shadow-sm transition-all">
              <Icon icon="heroicons:arrow-path" className="size-3.5" />
              {t("tourAdmin.basicInfo.replace", "Đổi ảnh")}
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1.5 rounded-xl bg-red-500/90 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 shadow-sm transition-all">
              <Icon icon="heroicons:trash" className="size-3.5" />
              {t("common.remove", "Xóa")}
            </button>
          </div>
        </div>
        {/* Cover badge */}
        <span className="absolute bottom-1 left-1 rounded-md bg-black/50 text-white text-[10px] font-semibold px-1.5 py-0.5">
          Cover
        </span>
      </div>
      {thumbnailError && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400 text-center">
          {thumbnailError}
        </p>
      )}
    </div>
  );
}

/* ── validateFile ───────────────────────────────────────────── */
function validateFile(
  file: File,
  t: (key: string, fallback: string) => string,
): string | undefined {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return t("tourAdmin.validation.invalidFileType", "Invalid file type. Only PNG, JPG, WEBP allowed.");
  }
  if (file.size > MAX_FILE_SIZE) {
    return t("tourAdmin.validation.fileTooLarge", "File too large. Maximum size is 10MB.");
  }
  return undefined;
}

interface ExistingImage {
  fileId?: string | null;
  publicURL?: string | null;
  fileName?: string | null;
  originalFileName?: string | null;
}

interface TourImageUploadProps {
  thumbnail: File | null;
  setThumbnail: (file: File | null) => void;
  images: File[];
  setImages: (files: File[]) => void;
  t: (key: string, fallback: string) => string;
  thumbnailError?: string;
  imagesError?: string;
  onThumbnailError?: (msg: string | undefined) => void;
  onImagesError?: (msg: string | undefined) => void;
  /** Existing images from the server — shown with remove option, managed by parent state */
  existingImages?: ExistingImage[];
  onRemoveExistingImage?: (image: ExistingImage) => void;
  /** Existing thumbnail from the server — shown with remove/replace option in edit mode */
  existingThumbnail?: ExistingImage | null;
  onRemoveExistingThumbnail?: () => void;
}

export default function TourImageUpload({
  thumbnail,
  setThumbnail,
  images,
  setImages,
  t,
  thumbnailError,
  imagesError,
  onThumbnailError,
  onImagesError,
  existingImages = [],
  onRemoveExistingImage,
  existingThumbnail,
  onRemoveExistingThumbnail,
}: TourImageUploadProps) {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const thumbnailUrl = thumbnail ? URL.createObjectURL(thumbnail) : null;

  // Show existing thumbnail when user removed a new selection and the prop is still set
  const showExistingThumbnail = !thumbnail && !!existingThumbnail?.publicURL;

  const handleThumbnailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const error = validateFile(file, t);
      onThumbnailError?.(error);
      if (!error) {
        setThumbnail(file);
      }
    },
    [setThumbnail, onThumbnailError, t],
  );

  const handleGalleryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;

      const MAX_IMAGES = 20;
      const totalAllowed = MAX_IMAGES - existingImages.length;
      const remaining = totalAllowed - images.length;
      if (remaining <= 0) {
        onImagesError?.(t("tourAdmin.validation.maxImagesReached", `Maximum ${MAX_IMAGES} images allowed.`));
        return;
      }

      const toAdd = files.slice(0, remaining);
      const errors: string[] = [];
      const validFiles: File[] = [];

      for (const file of toAdd) {
        const error = validateFile(file, t);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      }

      if (validFiles.length > 0) {
        setImages([...images, ...validFiles]);
      }
      onImagesError?.(errors.length > 0 ? errors.join("; ") : undefined);
    },
    [images, setImages, onImagesError, t, existingImages.length],
  );

  const removeGalleryImage = useCallback(
    (index: number) => {
      setImages(images.filter((_, i) => i !== index));
    },
    [images, setImages],
  );

  return (
    <div className="space-y-5">
      {/* ── Thumbnail ── */}
      <div className="space-y-2">
        <div>
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("tourAdmin.basicInfo.thumbnail", "Ảnh đại diện (Thumbnail)")}
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {t(
              "tourAdmin.basicInfo.thumbnailDesc",
              "Kích thước khuyến nghị: 600x600 pixels",
            )}
          </p>
        </div>

        <input
          ref={thumbnailInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleThumbnailChange}
        />

        {thumbnailUrl ? (
          <div className="relative group">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-[var(--border)] shadow-sm">
              <Image
                src={thumbnailUrl}
                alt="Thumbnail preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white shadow-sm transition-all">
                    <Icon icon="heroicons:arrow-path" className="size-3.5" />
                    {t("tourAdmin.basicInfo.replace", "Đổi ảnh")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbnail(null)}
                    className="flex items-center gap-1.5 rounded-xl bg-red-500/90 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 shadow-sm transition-all">
                    <Icon icon="heroicons:trash" className="size-3.5" />
                    {t("common.remove", "Xóa")}
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-[var(--text-muted)] text-center">
              {thumbnail.name}
            </p>
            {thumbnailError && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400 text-center">
                {thumbnailError}
              </p>
            )}
          </div>
        ) : showExistingThumbnail ? (
          <ExistingThumbnailPreview
            url={existingThumbnail!.publicURL!}
            t={t}
            onReplace={() => thumbnailInputRef.current?.click()}
            onRemove={() => {
              onRemoveExistingThumbnail?.();
            }}
            thumbnailError={thumbnailError}
            onThumbnailError={onThumbnailError}
          />
        ) : (
          <button
            type="button"
            onClick={() => thumbnailInputRef.current?.click()}
            className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-3 hover:border-primary/40 hover:bg-[var(--muted)]/50 transition-all duration-200 cursor-pointer group">
            <div className="size-12 rounded-full bg-[var(--muted)] flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-200">
              <Icon
                icon="heroicons:photo"
                className="size-6 text-[var(--text-muted)] group-hover:text-primary transition-colors duration-200"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {t(
                  "tourAdmin.basicInfo.uploadThumbnail",
                  "Tải lên ảnh đại diện",
                )}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                PNG, JPG, WEBP · {t("tourAdmin.basicInfo.maxSize", "Tối đa 10MB")}
              </p>
            </div>
          </button>
        )}
      </div>

      {/* ── Gallery ── */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("tourAdmin.basicInfo.gallery", "Thư viện ảnh (Gallery)")}
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {t(
              "tourAdmin.basicInfo.galleryDesc",
              "Tối đa 20 ảnh · Khuyến nghị: 600x600 pixels",
            )}
          </p>
        </div>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleGalleryChange}
        />

        {/* Existing images */}
        {existingImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((img, index) => (
              <div
                key={img.fileId ?? `existing-${index}`}
                className="relative group aspect-square">
                <div className="relative w-full h-full rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
                  {img.publicURL ? (
                    <Image
                      src={img.publicURL}
                      alt={img.fileName ?? `Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--muted)] flex items-center justify-center">
                      <Icon icon="heroicons:photo" className="size-6 text-[var(--text-muted)]" />
                    </div>
                  )}
                </div>
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemoveExistingImage?.(img)}
                  className="absolute -top-1.5 -right-1.5 size-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md hover:bg-red-600 z-10"
                  title={t("common.remove", "Xóa")}>
                  <Icon icon="heroicons:x-mark" className="size-3" weight="bold" />
                </button>
                {/* Index badge */}
                <span className="absolute bottom-1 left-1 rounded-md bg-black/50 text-white text-[10px] font-semibold px-1.5 py-0.5">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* New image grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((file, index) => {
              const url = URL.createObjectURL(file);
              return (
                <div
                  key={`gallery-${index}`}
                  className="relative group aspect-square">
                  <div className="relative w-full h-full rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
                    <Image
                      src={url}
                      alt={`Gallery image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                  </div>
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute -top-1.5 -right-1.5 size-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md hover:bg-red-600 z-10"
                    title={t("common.remove", "Xóa")}>
                    <Icon icon="heroicons:x-mark" className="size-3" weight="bold" />
                  </button>
                  {/* Index badge */}
                  <span className="absolute bottom-1 left-1 rounded-md bg-black/50 text-white text-[10px] font-semibold px-1.5 py-0.5">
                    {existingImages.length + index + 1}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Add more button */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="w-full py-8 rounded-2xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-[var(--muted)]/50 transition-all duration-200 cursor-pointer group">
          <div className="size-10 rounded-full bg-[var(--muted)] flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-200">
            <Icon
              icon="heroicons:plus"
              className="size-5 text-[var(--text-muted)] group-hover:text-primary transition-colors duration-200"
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {images.length > 0 || existingImages.length > 0
                ? t(
                    "tourAdmin.basicInfo.addMoreImages",
                    "Thêm ảnh khác",
                  )
                : t(
                    "tourAdmin.basicInfo.uploadGallery",
                    "Tải lên thư viện ảnh",
                  )}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              PNG, JPG, WEBP · {t("tourAdmin.basicInfo.maxSize", "Tối đa 10MB")}
            </p>
          </div>
        </button>

        {(images.length > 0 || existingImages.length > 0) && (
          <p className="text-xs text-[var(--text-muted)] text-center">
            {existingImages.length + images.length}{" "}
            {t("tourAdmin.basicInfo.imagesSelected", "ảnh đã chọn")}
            {existingImages.length > 0 && (
              <span className="ml-1 text-[var(--text-muted)]">
                ({existingImages.length} {t("tourAdmin.existing", "cũ")}, {images.length} {t("tourAdmin.new", "mới")})
              </span>
            )}
          </p>
        )}
        {imagesError && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400 text-center">
            {imagesError}
          </p>
        )}
      </div>
    </div>
  );
}
