import { v2 as cloudinary } from 'cloudinary';

// Lazy initialization for Cloudinary
let _configured = false;

function getCloudinary() {
    if (!_configured) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        _configured = true;
    }
    return cloudinary;
}

export interface UploadResult {
    publicId: string;
    secureUrl: string;
    format: string;
    width?: number;
    height?: number;
}

/**
 * Upload a file to Cloudinary
 */
export async function uploadToCloudinary(
    file: Buffer,
    fileName: string,
    folder: string
): Promise<UploadResult> {
    const cld = getCloudinary();

    // Convert buffer to base64 data URI
    const base64 = file.toString('base64');
    const mimeType = getMimeType(fileName);
    const dataUri = `data:${mimeType};base64,${base64}`;

    // Generate public_id from filename without extension
    const publicId = fileName.replace(/\.[^.]+$/, '');

    const result = await cld.uploader.upload(dataUri, {
        folder: folder,
        public_id: publicId,
        resource_type: 'auto',
        overwrite: true,
    });

    return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
    };
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
    const cld = getCloudinary();

    try {
        const result = await cld.uploader.destroy(publicId);
        return result.result === 'ok';
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        return false;
    }
}

/**
 * Get optimized URL for an image
 */
export function getOptimizedUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
}): string {
    const cld = getCloudinary();

    const transformations: any[] = [];

    if (options?.width || options?.height) {
        transformations.push({
            width: options.width,
            height: options.height,
            crop: 'limit',
        });
    }

    if (options?.quality) {
        transformations.push({ quality: options.quality });
    }

    if (options?.format) {
        transformations.push({ fetch_format: options.format });
    }

    return cld.url(publicId, {
        transformation: transformations,
        secure: true,
    });
}

function getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
    };
    return mimeTypes[ext] || 'application/octet-stream';
}
