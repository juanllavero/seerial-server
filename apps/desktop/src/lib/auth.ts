export async function authenticatedFetch(
	url: string,
	type: string = "GET",
	body?: unknown,
) {
	const options: RequestInit = {
		method: type,
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
	};

	if (body && type !== "GET") {
		options.body = JSON.stringify(body);
	}

	return await fetch(url, options);
}

/**
 * Fetches data from a given URL and returns the parsed JSON response.
 *
 * @param url - The URL to fetch data from.
 * @param token - The token to use for authentication.
 * @returns A promise that resolves to the parsed JSON data.
 */
export const authenticatedFetcher = async (url: string) => {
	const res = await fetch(url, {
		credentials: "include",
	});
	return await res.json();
};
