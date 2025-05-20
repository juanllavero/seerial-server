import { config } from "dotenv";
import { build } from "electron-builder";

config(); // Load environment variables

if (!process.env.GH_TOKEN) {
  console.error("Error: GH_TOKEN not found in .env");
  process.exit(1);
}

build({
  publish: "always",
  config: {
    directories: {
      output: "prod",
    },
    files: [
      "prod/*.exe", // Only publish the .exe file
    ],
  },
})
  .then(() => {
    console.log("Publish accepted");
  })
  .catch((error) => {
    console.error("Error publishing:", error);
    process.exit(1);
  });
