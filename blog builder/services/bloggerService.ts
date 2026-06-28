import { BloggerCreds } from '../types';

// --- MOCK SERVICE WARNING ---
// The following is a MOCK service for Blogger. The Blogger API for creating posts
// with an API key is very limited and a full implementation requires OAuth2,
// which is beyond the scope of this frontend-only application.
// This service simulates the API calls for demonstration purposes.

async function makeBloggerRequest<T>(creds: BloggerCreds, endpoint: string, options: RequestInit): Promise<T> {
  // A real implementation would use OAuth2 to get an access token.
  // We'll use the API key in the URL, which is only suitable for public data reads.
  const baseUrl = `https://www.googleapis.com/blogger/v3/blogs/${creds.blogId}`;
  const fullUrl = `${baseUrl}/${endpoint}?key=${creds.apiKey}`;

  // MOCKING the response since API key cannot create posts.
  if (options.method === 'POST') {
    console.log("MOCK Blogger POST request to:", fullUrl, "with body:", options.body);
    // Simulate a successful post creation
    return Promise.resolve({
      id: "123456789",
      url: `https://mock-blog-url.blogspot.com/2024/01/mock-post.html`
    } as T);
  }
  
  // For 'test connection', we'll simulate a fetch to the blog's main endpoint.
  const response = await fetch(fullUrl, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }));
    throw new Error(`Blogger API Error: ${response.status} - ${errorData.error.message || 'Failed to fetch'}`);
  }
  return response.json();
}

export async function testConnection(creds: BloggerCreds): Promise<{ ok: boolean; message: string }> {
  if (!creds.blogId || !creds.apiKey) {
    return { ok: false, message: 'Blog ID and API Key are required.' };
  }
  try {
    // This endpoint fetches basic info about the blog. It's a good way to test credentials.
    const data = await makeBloggerRequest<{ name: string }>(creds, '', { method: 'GET' });
    return { ok: true, message: `Connection successful to blog: "${data.name}"` };
  } catch (error: any) {
    return { ok: false, message: error.message || 'Failed to connect.' };
  }
}

export async function createPost(
  creds: BloggerCreds,
  title: string,
  content: string, // HTML content
  isPublished: boolean
): Promise<string> {
  const postData = {
    kind: "blogger#post",
    blog: {
      id: creds.blogId
    },
    title: title,
    content: content
  };

  const endpoint = isPublished ? 'posts' : 'posts?isDraft=true';
  
  const response = await makeBloggerRequest<{ url: string }>(creds, endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  });

  return response.url;
}