import axios from "axios";
import logger from "@/utils/logger";
import type { IMDBScoreServicePort } from "../../../application/ports/IMDBScoreServicePort";

const imdbLogger = logger.child({ category: "IMDB Score" });

const parseRatingValue = (value: unknown): number | null => {
	if (typeof value !== "number" && typeof value !== "string") {
		return null;
	}

	const parsed = Number(value.toString().replace(",", "."));
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return null;
	}

	return parsed;
};

interface ImdbApiResponse {
	rating?: {
		aggregateRating?: unknown;
	};
}

const isTransientImdbError = (error: unknown): boolean => {
	if (!axios.isAxiosError(error)) {
		return false;
	}

	if (error.code === "ECONNABORTED") {
		return true;
	}

	const status = error.response?.status;
	return status === 429 || status === 502 || status === 503 || status === 504;
};

const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

export class IMDBScoreServiceImpl implements IMDBScoreServicePort {
	private readonly imdbApiBaseUrl = "https://api.imdbapi.dev/titles";

	axiosClient = axios.create({
		timeout: 10000,
	});

	private async fetchImdbData(url: string): Promise<ImdbApiResponse> {
		const maxAttempts = 3;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				const { data } = await this.axiosClient.get<ImdbApiResponse>(url);
				return data;
			} catch (error: unknown) {
				const isLastAttempt = attempt === maxAttempts;
				const transient = isTransientImdbError(error);

				if (!transient || isLastAttempt) {
					throw error;
				}

				await sleep(attempt * 300);
			}
		}

		throw new Error("Unable to fetch IMDb page after retries");
	}

	async getIMDBScore(imdbID: string): Promise<number> {
		try {
			const url = `${this.imdbApiBaseUrl}/${imdbID}`;
			const data = await this.fetchImdbData(url);
			const rating = parseRatingValue(data.rating?.aggregateRating);

			if (rating !== null) {
				return rating;
			}

			imdbLogger.warn({ imdbID }, "IMDb score not found in API payload");
			return -1;
		} catch (error: unknown) {
			if (axios.isAxiosError(error)) {
				imdbLogger.warn(
					{
						imdbID,
						code: error.code,
						status: error.response?.status,
						message: error.message,
					},
					"IMDb score request failed",
				);
			} else {
				imdbLogger.warn({ imdbID, error }, "IMDb score parsing failed");
			}

			return -1;
		}
	}
}
