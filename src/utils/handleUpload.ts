import fs from 'fs';
import path from 'path';

export const handleUpload = async ({ file, key }: { file: any, key: string }) => {
  try {
    const uploadPath = path.join(__dirname, 'uploads', key);
    await fs.promises.writeFile(uploadPath, file.buffer);
    console.log(`File uploaded successfully to ${uploadPath}`);
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(error.message);
  }
};