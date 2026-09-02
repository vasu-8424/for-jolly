"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function uploadImageAction(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}> {
  try {
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "products";

    if (!file) {
      return { success: false, error: "No image file provided." };
    }

    const supabase = await createAdminClient();

    // Ensure target storage bucket exists and is marked public
    try {
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucket);
      if (bucketError || !bucketData) {
        await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 15728640, // 15 MB
        });
      }
    } catch {
      // If get/create bucket fails due to permissions or pre-existence, proceed to upload
    }

    const rawExt = file.name ? file.name.split(".").pop()?.toLowerCase() : "webp";
    const fileExt = rawExt && ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(rawExt) ? rawExt : "webp";
    const uniqueId = `${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
    const filePath = `${uniqueId}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type || `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      path: filePath,
    };
  } catch (err: any) {
    console.error("Failed to upload image:", err);
    return {
      success: false,
      error: err?.message || "Failed to upload image. Please verify your Supabase configuration.",
    };
  }
}

export async function deleteImageAction(bucket: string, fileUrlOrPath: string) {
  try {
    const supabase = await createAdminClient();
    
    // If a full public URL was provided, extract just the filename
    let filePath = fileUrlOrPath;
    if (fileUrlOrPath.includes(`/${bucket}/`)) {
      const parts = fileUrlOrPath.split(`/${bucket}/`);
      filePath = parts[parts.length - 1];
    }

    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete image" };
  }
}

export async function sweepOrphanImages(bucket: string = "products") {
  const supabase = await createAdminClient();

  const activeImageUrls = new Set<string>();

  // 1. Fetch active URLs depending on the target bucket
  if (bucket === "products") {
    const { data: productImages, error: dbError } = await supabase
      .from("product_images")
      .select("image_url");

    if (!dbError && productImages) {
      productImages.forEach((img: { image_url: string }) => {
        if (img.image_url) {
          const parts = img.image_url.split(`/${bucket}/`);
          if (parts.length > 1) {
            activeImageUrls.add(parts[parts.length - 1]);
          }
        }
      });
    }
  } else if (bucket === "categories") {
    const { data: categories } = await supabase
      .from("categories")
      .select("image");

    if (categories) {
      categories.forEach((cat: { image: string }) => {
        if (cat.image) {
          const parts = cat.image.split(`/${bucket}/`);
          if (parts.length > 1) {
            activeImageUrls.add(parts[parts.length - 1]);
          }
        }
      });
    }
  } else if (bucket === "banners") {
    const { data: banners } = await supabase
      .from("homepage_banners")
      .select("image_url");

    if (banners) {
      banners.forEach((b: { image_url: string }) => {
        if (b.image_url) {
          const parts = b.image_url.split(`/${bucket}/`);
          if (parts.length > 1) {
            activeImageUrls.add(parts[parts.length - 1]);
          }
        }
      });
    }
  }

  // 2. Fetch all files from Supabase Storage bucket
  const { data: storageFiles, error: storageError } = await supabase.storage
    .from(bucket)
    .list();

  if (storageError) {
    return { success: false, error: storageError.message };
  }

  const filesToDelete: string[] = [];

  storageFiles.forEach((file) => {
    // skip folders if any (represented by empty .emptyFolderPlaceholder)
    if (file.name === ".emptyFolderPlaceholder") return;

    if (!activeImageUrls.has(file.name)) {
      filesToDelete.push(file.name);
    }
  });

  // 3. Delete orphan files
  if (filesToDelete.length > 0) {
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove(filesToDelete);
      
    if (deleteError) {
      return { success: false, error: deleteError.message };
    }
  }

  return { 
    success: true, 
    sweptCount: filesToDelete.length,
    activeCount: activeImageUrls.size,
    message: `Successfully deleted ${filesToDelete.length} orphan images.`
  };
}
