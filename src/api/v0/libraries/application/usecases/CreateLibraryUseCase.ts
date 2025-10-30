import { scanFiles } from "@/file-search/fileSearch";
import { Library } from "../../domain/Library";

export class CreateLibraryUseCase {
  constructor() {}

  async execute(libraryData: Partial<Library>): Promise<Library> {
    return await scanFiles(libraryData, true);
  }
}
