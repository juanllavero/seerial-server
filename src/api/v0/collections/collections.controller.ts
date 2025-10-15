import fs from "fs-extra";
import path from "path";
import { Collection } from "./collections.model";

// Delete collection stored data
export async function deleteCollectionData(collection: Collection) {
  try {
    await fs.remove(
      path.join("resources", "img", "posters", collection.id ?? "")
    );
    await fs.remove(
      path.join("resources", "img", "backgrounds", collection.id ?? "")
    );
  } catch (error) {
    console.error(
      "deleteCollectionData: Error deleting images files and directories",
      error
    );
  }
}
