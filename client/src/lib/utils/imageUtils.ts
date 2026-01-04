/**
 * Resolves a product image URL by prepending the backend API base URL if necessary.
 * Includes a fallback to localhost:3001 if NEXT_PUBLIC_API_URL is undefined.
 * Returns empty string if imagePath is invalid or empty.
 */
import { getApiBaseUrl } from '../config/env';

export const resolveImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '' || imagePath === 'null' || imagePath === 'undefined') {
        return '';
    }

    // If it's a full URL or base64 data URL, return as is
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
        return imagePath;
    }

    const baseUrl = getApiBaseUrl();
    const cleanBaseUrl = baseUrl.replace('/api/v1', '');

    // Ensure we don't end up with double slashes if imagePath starts with /
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

    const resolvedUrl = `${cleanBaseUrl}${normalizedPath}`;
    console.log('resolveImageUrl:', { imagePath, resolvedUrl });
    return resolvedUrl;
};

