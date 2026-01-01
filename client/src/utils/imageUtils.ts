/**
 * Resolves a product image URL by prepending the backend API base URL if necessary.
 * Includes a fallback to localhost:3001 if NEXT_PUBLIC_API_URL is undefined.
 */
export const resolveImageUrl = (imagePath: string): string => {
    if (!imagePath) return '';

    // If it's a full URL or base64 data URL, return as is
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
        return imagePath;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const cleanBaseUrl = baseUrl.replace('/api/v1', '');

    // Ensure we don't end up with double slashes if imagePath starts with /
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

    return `${cleanBaseUrl}${normalizedPath}`;
};
