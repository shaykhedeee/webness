import { WordPressCreds, PublishStatus } from '../types';
import { base64ToBlob } from '../utils/file';

// --- SECURITY WARNING ---
// The following functions handle authentication directly in the frontend.
// This is INSECURE and should NEVER be done in a production application.
// In a real-world scenario, all communication with the WordPress API
// must be proxied through a secure backend server that manages credentials safely.

async function makeWpRequest<T>(creds: WordPressCreds, endpoint: string, options: RequestInit): Promise<T> {
  const url = creds.url.endsWith('/') ? creds.url : `${creds.url}/`;
  const fullUrl = `${url}wp-json/wp/v2/${endpoint}`;

  const headers = new Headers(options.headers || {});
  const encodedCreds = btoa(`${creds.username}:${creds.appPassword}`);
  headers.set('Authorization', `Basic ${encodedCreds}`);

  const response = await fetch(fullUrl, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown API error' }));
    throw new Error(`WordPress API Error: ${response.status} - ${errorData.message || 'Failed to fetch'}`);
  }
  // For GET requests that might return no content on success (like a 204)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
  }
  return response.json();
}

export async function testConnection(creds: WordPressCreds): Promise<{ ok: boolean; message: string }> {
  try {
    // '/wp/v2/users/me' is a protected endpoint that requires authentication, perfect for testing.
    await makeWpRequest(creds, 'users/me', { method: 'GET' });
    return { ok: true, message: 'Connection successful!' };
  } catch (error: any) {
    return { ok: false, message: error.message || 'Failed to connect.' };
  }
}

export async function uploadImage(creds: WordPressCreds, imageBase64: string, filename: string): Promise<any> {
  const imageBlob = base64ToBlob(imageBase64, 'image/jpeg');

  const headers = new Headers();
  headers.set('Content-Disposition', `attachment; filename="${filename}"`);
  headers.set('Content-Type', 'image/jpeg');

  const url = creds.url.endsWith('/') ? creds.url : `${creds.url}/`;
  const fullUrl = `${url}wp-json/wp/v2/media`;

  const encodedCreds = btoa(`${creds.username}:${creds.appPassword}`);
  headers.set('Authorization', `Basic ${encodedCreds}`);

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers,
    body: imageBlob,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown API error during image upload' }));
    throw new Error(`WordPress API Error: ${response.status} - ${errorData.message || 'Failed to upload image'}`);
  }
  
  return response.json();
}


export async function createPost(
  creds: WordPressCreds,
  title: string,
  content: string,
  featuredMediaId: number,
  status: PublishStatus
): Promise<string> {
  const postData = {
    title,
    content,
    status,
    featured_media: featuredMediaId,
    // You can add categories and tags here if needed
    // categories: [1, 2],
    // tags: [3, 4]
  };

  const response = await makeWpRequest<{ link: string }>(creds, 'posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  });

  return response.link;
}
