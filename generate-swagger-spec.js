const swaggerJSDoc = require("swagger-jsdoc");
const fs = require("fs");

// Swagger configuration (copied from src/index.ts)
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Seerial Media Server API",
      version: "0.2.0",
      description: "Media management server API for the Seerial suite",
      contact: {
        name: "Juan Llavero",
      },
    },
    servers: [
      {
        url: "http://localhost:34200/api",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ["./src/api/**/*.ts"], // Path to the API docs - adjusted path
};

console.log("Generating Swagger spec from source files...");
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Save as JSON
fs.writeFileSync("swagger-spec.json", JSON.stringify(swaggerSpec, null, 2));
console.log("Swagger spec saved to swagger-spec.json");

// Save as readable text format
let textOutput = "# Seerial Media Server API Documentation\n\n";
textOutput += `Version: ${swaggerSpec.info.version}\n`;
textOutput += `Description: ${swaggerSpec.info.description}\n\n`;

// Extract endpoints
if (swaggerSpec.paths) {
  Object.keys(swaggerSpec.paths).forEach((path) => {
    textOutput += `## ${path}\n\n`;
    Object.keys(swaggerSpec.paths[path]).forEach((method) => {
      const endpoint = swaggerSpec.paths[path][method];
      textOutput += `### ${method.toUpperCase()}\n`;
      textOutput += `Summary: ${endpoint.summary || "No summary"}\n`;
      if (endpoint.description) {
        textOutput += `Description: ${endpoint.description}\n`;
      }
      if (endpoint.parameters) {
        textOutput += "Parameters:\n";
        endpoint.parameters.forEach((param) => {
          textOutput += `  - ${param.name} (${param.in}): ${
            param.description || "No description"
          }\n`;
        });
      }
      if (endpoint.requestBody) {
        textOutput += "Request Body: Available\n";
      }
      if (endpoint.responses) {
        textOutput += "Responses:\n";
        Object.keys(endpoint.responses).forEach((code) => {
          textOutput += `  - ${code}: ${
            endpoint.responses[code].description || "No description"
          }\n`;
        });
      }
      textOutput += "\n";
    });
    textOutput += "\n";
  });
}

fs.writeFileSync("swagger-endpoints.txt", textOutput);
console.log("Swagger endpoints saved to swagger-endpoints.txt");

// Also save as Markdown for better readability
let markdownOutput = "# Seerial Media Server API Documentation\n\n";
markdownOutput += `**Version:** ${swaggerSpec.info.version}\n\n`;
markdownOutput += `**Description:** ${swaggerSpec.info.description}\n\n`;

if (swaggerSpec.paths) {
  Object.keys(swaggerSpec.paths).forEach((path) => {
    markdownOutput += `## ${path}\n\n`;
    Object.keys(swaggerSpec.paths[path]).forEach((method) => {
      const endpoint = swaggerSpec.paths[path][method];
      markdownOutput += `### ${method.toUpperCase()}\n\n`;
      if (endpoint.summary) {
        markdownOutput += `**Summary:** ${endpoint.summary}\n\n`;
      }
      if (endpoint.description) {
        markdownOutput += `**Description:** ${endpoint.description}\n\n`;
      }
      if (endpoint.parameters && endpoint.parameters.length > 0) {
        markdownOutput += "**Parameters:**\n\n";
        endpoint.parameters.forEach((param) => {
          markdownOutput += `- \`${param.name}\` (${param.in}): ${
            param.description || "No description"
          }\n`;
        });
        markdownOutput += "\n";
      }
      if (endpoint.requestBody) {
        markdownOutput += "**Request Body:** Available\n\n";
      }
      if (endpoint.responses) {
        markdownOutput += "**Responses:**\n\n";
        Object.keys(endpoint.responses).forEach((code) => {
          markdownOutput += `- **${code}**: ${
            endpoint.responses[code].description || "No description"
          }\n`;
        });
        markdownOutput += "\n";
      }
    });
  });
}

fs.writeFileSync("swagger-api-docs.md", markdownOutput);
console.log("Swagger API docs saved to swagger-api-docs.md");

console.log("\nFiles generated:");
console.log("- swagger-spec.json (OpenAPI 3.0 JSON specification)");
console.log("- swagger-endpoints.txt (Simple text format)");
console.log("- swagger-api-docs.md (Markdown format for AI reading)");
