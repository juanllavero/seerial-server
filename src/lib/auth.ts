export async function authenticatedFetch(
  url: string,
  type: string = 'GET',
  body?: any,
) {
  const options: RequestInit = {
    method: type,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  }

  if (body && type !== 'GET') {
    options.body = JSON.stringify(body)
  }

  return await fetch(url, options)
}
