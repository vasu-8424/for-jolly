"use client";

import { useState, useCallback } from "react";
import { uploadImageAction, deleteImageAction } from "@/actions/storage";
import { Button } from "@/components/ui/button";
import { X, UploadCloud, Loader2, ArrowLeft, ArrowRight, RotateCw, Check } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import { compressImage, getCroppedImg } from "@/lib/utils/image-helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import toast from "react-hot-toast";

interface ImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  bucket?: string;
  maxFiles?: number;
}

export function ImageUpload({ value = [], onChange, bucket = "products", maxFiles }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0]; // Process one at a time for cropping
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result?.toString() || null);
      setCurrentFile(file);
      setCropModalOpen(true);
    });
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { 
      "image/png": [], 
      "image/jpeg": [], 
      "image/webp": [],
      "image/jpg": [],
    },
    disabled: isUploading,
    multiple: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const uploadFileToServer = async (fileToUpload: File) => {
    try {
      setIsUploading(true);
      const loadingToast = toast.loading("Compressing and uploading image...");
      
      const compressedFile = await compressImage(fileToUpload);
      
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("bucket", bucket);

      const result = await uploadImageAction(formData);

      toast.dismiss(loadingToast);

      if (!result.success || !result.url) {
        toast.error(result.error || "Failed to upload image. Please try again.");
        return;
      }

      toast.success("Image uploaded successfully!");
      onChange([...(value || []), result.url]);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Error uploading image: " + (error?.message || "Unknown error"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setCropModalOpen(false);
    setIsUploading(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedFile) {
        await uploadFileToServer(croppedFile);
      } else if (currentFile) {
        await uploadFileToServer(currentFile);
      }
    } catch (e: any) {
      console.error("Crop error:", e);
      // Fallback: upload original if cropping fails
      if (currentFile) {
        await uploadFileToServer(currentFile);
      } else {
        toast.error("Failed to process image.");
      }
    } finally {
      setIsUploading(false);
      setImageSrc(null);
      setCurrentFile(null);
      setRotation(0);
      setZoom(1);
    }
  };

  const handleSkipCrop = async () => {
    setCropModalOpen(false);
    if (currentFile) {
      await uploadFileToServer(currentFile);
    }
    setImageSrc(null);
    setCurrentFile(null);
    setRotation(0);
    setZoom(1);
  };

  const handleRemove = async (urlToRemove: string) => {
    const updated = (value || []).filter((url) => url !== urlToRemove);
    onChange(updated);
    // Optionally trigger background cleanup of deleted image
    deleteImageAction(bucket, urlToRemove).catch((err) => console.error("Silent delete error:", err));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === (value || []).length - 1) return;
    
    const newValues = [...(value || [])];
    const swapIndex = direction === 'left' ? index - 1 : index + 1;
    [newValues[index], newValues[swapIndex]] = [newValues[swapIndex], newValues[index]];
    onChange(newValues);
  };

  return (
    <div className="space-y-4">
      <div className={maxFiles === 1 ? "grid grid-cols-1 gap-4" : "grid grid-cols-2 md:grid-cols-4 gap-4"}>
        {(value || []).map((url, index) => (
          <div key={url} className={`relative group rounded-xl overflow-hidden border bg-muted ${maxFiles === 1 ? 'aspect-video' : 'aspect-square'}`}>
            <img src={url} alt="Uploaded preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <div className="flex gap-2">
                {maxFiles !== 1 && (
                  <Button type="button" variant="secondary" size="icon" onClick={() => moveImage(index, 'left')} disabled={index === 0}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemove(url)}>
                  <X className="w-4 h-4" />
                </Button>
                {maxFiles !== 1 && (
                  <Button type="button" variant="secondary" size="icon" onClick={() => moveImage(index, 'right')} disabled={index === (value || []).length - 1}>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            {index === 0 && maxFiles !== 1 && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md shadow-sm font-semibold">
                Thumbnail
              </div>
            )}
          </div>
        ))}

        {(!maxFiles || (value || []).length < maxFiles) && (
          <div
            {...getRootProps()}
            className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-colors bg-card
              ${maxFiles === 1 ? 'h-40 p-6' : 'aspect-square p-2'}
              ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'}
            `}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground font-medium">Uploading to cloud...</span>
              </div>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-center px-4 text-foreground">
                  {isDragActive ? "Drop image here" : "Drag & Drop or Click to Upload"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 15MB</span>
              </>
            )}
          </div>
        )}
      </div>

      <Dialog open={cropModalOpen} onOpenChange={(open) => !open && setCropModalOpen(false)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Crop & Adjust Image</DialogTitle>
          </DialogHeader>
          <div className="relative h-80 w-full bg-black/10 rounded-md overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" type="button" onClick={() => setRotation((r) => r + 90)}>
              <RotateCw className="w-4 h-4 mr-2" />
              Rotate 90°
            </Button>
            <div className="space-x-2">
              <Button variant="ghost" type="button" onClick={handleSkipCrop}>Upload As-Is</Button>
              <Button type="button" onClick={handleCropSave} className="gap-2">
                <Check className="w-4 h-4" /> Save & Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
