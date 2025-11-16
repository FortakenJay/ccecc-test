export async function fetchAPI(
  endpoint: string,
  options?: RequestInit
): Promise<{ data?: any; error?: string }> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || 'Something went wrong' };
    }

    return { data: result.data };
  } catch (error: any) {
    return { error: error.message || 'Network error' };
  }
}

export async function getRequest(endpoint: string) {
  return fetchAPI(endpoint, { method: 'GET' });
}

export async function postRequest(endpoint: string, body: any) {
  return fetchAPI(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function putRequest(endpoint: string, body: any) {
  return fetchAPI(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteRequest(endpoint: string) {
  return fetchAPI(endpoint, { method: 'DELETE' });
}
