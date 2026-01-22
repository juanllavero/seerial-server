import path from "path";
import propertiesReader from "properties-reader";
import { fileSystemService } from "../di/container";

export class TMDbApiClient {
  private BASE_URL = "https://api.themoviedb.org/3";
  public THEMOVIEDB_API_TOKEN: string = "";
  public connectionStatus: boolean = false;

  async makeRequest(
    endpoint: string,
    queryParams: Record<string, any> = {}
  ): Promise<any> {
    const url = new URL(`${this.BASE_URL}/${endpoint}`);

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${this.THEMOVIEDB_API_TOKEN}`,
      },
    });

    return await response.json();
  }

  getAPIKeyStatus = async (): Promise<boolean> => {
    const url = `${this.BASE_URL}/authentication`;
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${this.THEMOVIEDB_API_TOKEN}`,
      },
    };

    const response = await fetch(url, options);
    const data = (await response.json()) as { success: boolean };
    return data.success;
  };

  async initialize(): Promise<boolean> {
    if (this.connectionStatus) return true;

    const propertiesFilePath = fileSystemService.getExternalPath(
      path.join("resources", "config", "keys.properties")
    );

    if (!fileSystemService.isFile(propertiesFilePath)) {
      console.warn(
        "keys.properties file not found, omitting connection with TMDB."
      );
      return false;
    }

    const properties = propertiesReader(propertiesFilePath);

    // Get API Key
    this.THEMOVIEDB_API_TOKEN = properties.get("TMDB_API_KEY") as string;

    if (this.THEMOVIEDB_API_TOKEN) {
      const apiKeyStatus = await this.getAPIKeyStatus();

      if (!apiKeyStatus) {
        console.error("Invalid API Key");
        return false;
      }

      console.log("[MovieDB] Connected to TheMovieDB");
      this.connectionStatus = true;

      return true;
    } else {
      console.error("This App needs an API Key from TheMovieDB");
      return false;
    }
  }
}
