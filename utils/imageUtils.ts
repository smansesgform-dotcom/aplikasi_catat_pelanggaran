/**
 * Resizes and compresses an image file to be under a target size in kilobytes.
 * @param file The image file to process.
 * @param targetSizeKB The target file size in kilobytes.
 * @returns A promise that resolves with the processed image as a File object.
 */
export const resizeAndCompressImage = (file: File, targetSizeKB: number = 100): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error('FileReader did not load the file correctly.'));
      }

      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        const processBlob = (blob: Blob | null) => {
          if (!blob) {
            return reject(new Error('Canvas toBlob failed to produce a blob.'));
          }

          if (blob.size / 1024 <= targetSizeKB || quality <= 0.1) {
            const processedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(processedFile);
          } else {
            quality -= 0.1;
            canvas.toBlob(processBlob, 'image/jpeg', quality);
          }
        };
        
        canvas.toBlob(processBlob, 'image/jpeg', quality);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
