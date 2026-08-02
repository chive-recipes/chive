export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
}

export interface RecipeImages {
  fullsize: ProcessedImage;
  thumbnail: ProcessedImage;
}

/**
 * Reads a File into an Image object.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Resizes an image using a canvas and converts it to a WebP Blob.
 */
async function processImage(
  img: HTMLImageElement,
  maxSize: number,
  quality: number = 0.8
): Promise<ProcessedImage> {
  let width = img.width;
  let height = img.height;

  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    } else {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Draw white background in case of transparent images
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, width, height });
        } else {
          reject(new Error("Failed to create blob from canvas"));
        }
      },
      "image/webp",
      quality
    );
  });
}

/**
 * Takes a user-uploaded image file and returns two optimized WebP blobs:
 * 1. Fullsize (max 2000px, quality 0.8)
 * 2. Thumbnail (max 800px, quality 0.7)
 */
export async function processRecipeImage(file: File): Promise<RecipeImages> {
  const img = await loadImage(file);
  
  const [fullsize, thumbnail] = await Promise.all([
    processImage(img, 2000, 0.8),
    processImage(img, 800, 0.7),
  ]);

  return { fullsize, thumbnail };
}
