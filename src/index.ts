// #!/usr/bin/env node

// /**
//  * This is a template MCP server that implements a simple notes system.
//  * It demonstrates core MCP concepts like resources and tools by allowing:
//  * - Listing notes as resources
//  * - Reading individual notes
//  * - Creating new notes via a tool
//  * - Summarizing all notes via a prompt
//  */

// import { Server } from "@modelcontextprotocol/sdk/server/index.js";
// import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// import {
//   CallToolRequestSchema,
//   ListResourcesRequestSchema,
//   ListToolsRequestSchema,
//   ReadResourceRequestSchema,
//   ListPromptsRequestSchema,
//   GetPromptRequestSchema,
// } from "@modelcontextprotocol/sdk/types.js";

// /**
//  * Type alias for a note object.
//  */
// type Note = { title: string, content: string };

// /**
//  * Simple in-memory storage for notes.
//  * In a real implementation, this would likely be backed by a database.
//  */
// const notes: { [id: string]: Note } = {
//   "1": { title: "First Note", content: "This is note 1" },
//   "2": { title: "Second Note", content: "This is note 2" }
// };

// /**
//  * Create an MCP server with capabilities for resources (to list/read notes),
//  * tools (to create new notes), and prompts (to summarize notes).
//  */
// const server = new Server(
//   {
//     name: "weather-server",
//     version: "0.1.0",
//   },
//   {
//     capabilities: {
//       resources: {},
//       tools: {},
//       prompts: {},
//     },
//   }
// );

// /**
//  * Handler for listing available notes as resources.
//  * Each note is exposed as a resource with:
//  * - A note:// URI scheme
//  * - Plain text MIME type
//  * - Human readable name and description (now including the note title)
//  */
// server.setRequestHandler(ListResourcesRequestSchema, async () => {
//   return {
//     resources: Object.entries(notes).map(([id, note]) => ({
//       uri: `note:///${id}`,
//       mimeType: "text/plain",
//       name: note.title,
//       description: `A text note: ${note.title}`
//     }))
//   };
// });

// /**
//  * Handler for reading the contents of a specific note.
//  * Takes a note:// URI and returns the note content as plain text.
//  */
// server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
//   const url = new URL(request.params.uri);
//   const id = url.pathname.replace(/^\//, '');
//   const note = notes[id];

//   if (!note) {
//     throw new Error(`Note ${id} not found`);
//   }

//   return {
//     contents: [{
//       uri: request.params.uri,
//       mimeType: "text/plain",
//       text: note.content
//     }]
//   };
// });

// /**
//  * Handler that lists available tools.
//  * Exposes a single "create_note" tool that lets clients create new notes.
//  */
// server.setRequestHandler(ListToolsRequestSchema, async () => {
//   return {
//     tools: [
//       {
//         name: "create_note",
//         description: "Create a new note",
//         inputSchema: {
//           type: "object",
//           properties: {
//             title: {
//               type: "string",
//               description: "Title of the note"
//             },
//             content: {
//               type: "string",
//               description: "Text content of the note"
//             }
//           },
//           required: ["title", "content"]
//         }
//       }
//     ]
//   };
// });

// /**
//  * Handler for the create_note tool.
//  * Creates a new note with the provided title and content, and returns success message.
//  */
// server.setRequestHandler(CallToolRequestSchema, async (request) => {
//   switch (request.params.name) {
//     case "create_note": {
//       const title = String(request.params.arguments?.title);
//       const content = String(request.params.arguments?.content);
//       if (!title || !content) {
//         throw new Error("Title and content are required");
//       }

//       const id = String(Object.keys(notes).length + 1);
//       notes[id] = { title, content };

//       return {
//         content: [{
//           type: "text",
//           text: `Created note ${id}: ${title}`
//         }]
//       };
//     }

//     default:
//       throw new Error("Unknown tool");
//   }
// });

// /**
//  * Handler that lists available prompts.
//  * Exposes a single "summarize_notes" prompt that summarizes all notes.
//  */
// server.setRequestHandler(ListPromptsRequestSchema, async () => {
//   return {
//     prompts: [
//       {
//         name: "summarize_notes",
//         description: "Summarize all notes",
//       }
//     ]
//   };
// });

// /**
//  * Handler for the summarize_notes prompt.
//  * Returns a prompt that requests summarization of all notes, with the notes' contents embedded as resources.
//  */
// server.setRequestHandler(GetPromptRequestSchema, async (request) => {
//   if (request.params.name !== "summarize_notes") {
//     throw new Error("Unknown prompt");
//   }

//   const embeddedNotes = Object.entries(notes).map(([id, note]) => ({
//     type: "resource" as const,
//     resource: {
//       uri: `note:///${id}`,
//       mimeType: "text/plain",
//       text: note.content
//     }
//   }));

//   return {
//     messages: [
//       {
//         role: "user",
//         content: {
//           type: "text",
//           text: "Please summarize the following notes:"
//         }
//       },
//       ...embeddedNotes.map(note => ({
//         role: "user" as const,
//         content: note
//       })),
//       {
//         role: "user",
//         content: {
//           type: "text",
//           text: "Provide a concise summary of all the notes above."
//         }
//       }
//     ]
//   };
// });

// /**
//  * Start the server using stdio transport.
//  * This allows the server to communicate via standard input/output streams.
//  */
// async function main() {
//   const transport = new StdioServerTransport();
//   await server.connect(transport);
// }

// main().catch((error) => {
//   console.error("Server error:", error);
//   process.exit(1);
// });

// src/index.ts

if (typeof global.AbortController === "undefined") {
  // @ts-expect-error 타입 무시
  global.AbortController = (await import("abort-controller")).default;
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  ForecastDay,
  isValidForecastArgs,
  OpenWeatherResponse,
  WeatherData,
} from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_KEY = process.env.OPENWEATHER_API_KEY;
if (!API_KEY) {
  throw new Error("OPENWEATHER_API_KEY 환경 변수가 필요합니다");
}

const API_CONFIG = {
  BASE_URL: "http://api.openweathermap.org/data/2.5",
  DEFAULT_CITY: "Seoul",
  ENDPOINTS: {
    CURRENT: "weather",
    FORECAST: "forecast",
  },
} as const;

class WeatherServer {
  private server: Server;
  private axiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: "example-weather-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          resources: {
            [`weather://${API_CONFIG.DEFAULT_CITY}/current`]: {
              name: `${API_CONFIG.DEFAULT_CITY}의 현재 날씨`,
              mimeType: "application/json",
              description: "실시간 날씨 데이터 (온도, 날씨, 습도, 풍속)",
            },
          },
          tools: {
            get_forecast: {
              description: "도시의 날씨 예보를 가져옵니다",
              inputSchema: {
                type: "object",
                properties: {
                  city: {
                    type: "string",
                    description: "도시 이름",
                  },
                  days: {
                    type: "number",
                    description: "일수 (1-5)",
                    minimum: 1,
                    maximum: 5,
                  },
                },
                required: ["city"],
              },
            },
          },
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      params: {
        appid: API_KEY,
        units: "metric",
      },
    });

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers(): void {
    this.setupResourceHandlers();
    this.setupToolHandlers();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Weather MCP server running on stdio");
  }

  private setupResourceHandlers(): void {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: `weather://${API_CONFIG.DEFAULT_CITY}/current`,
          name: `${API_CONFIG.DEFAULT_CITY}의 현재 날씨`,
          mimeType: "application/json",
          description: "실시간 날씨 데이터 (온도, 날씨, 습도, 풍속)",
        },
      ],
    }));

    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const city = API_CONFIG.DEFAULT_CITY;
        if (request.params.uri !== `weather://${city}/current`) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `알 수 없는 리소스: ${request.params.uri}`
          );
        }

        try {
          const response = await this.axiosInstance.get<OpenWeatherResponse>(
            API_CONFIG.ENDPOINTS.CURRENT,
            { params: { q: city } }
          );

          const weatherData: WeatherData = {
            temperature: response.data.main.temp,
            conditions: response.data.weather[0].description,
            humidity: response.data.main.humidity,
            wind_speed: response.data.wind.speed,
            timestamp: new Date().toISOString(),
          };

          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: "application/json",
                text: JSON.stringify(weatherData, null, 2),
              },
            ],
          };
        } catch (error) {
          if (axios.isAxiosError(error)) {
            throw new McpError(
              ErrorCode.InternalError,
              `날씨 API 오류: ${error.response?.data.message ?? error.message}`
            );
          }
          throw error;
        }
      }
    );
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_forecast",
          description: "도시의 날씨 예보를 가져옵니다",
          inputSchema: {
            type: "object",
            properties: {
              city: {
                type: "string",
                description: "도시 이름",
              },
              days: {
                type: "number",
                description: "일수 (1-5)",
                minimum: 1,
                maximum: 5,
              },
            },
            required: ["city"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== "get_forecast") {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `알 수 없는 도구: ${request.params.name}`
        );
      }

      if (!isValidForecastArgs(request.params.arguments)) {
        throw new McpError(ErrorCode.InvalidParams, "잘못된 예보 인수");
      }

      const city = request.params.arguments.city;
      const days = Math.min(request.params.arguments.days || 3, 5);

      try {
        const response = await this.axiosInstance.get<{
          list: OpenWeatherResponse[];
        }>(API_CONFIG.ENDPOINTS.FORECAST, {
          params: {
            q: city,
            cnt: days * 8,
          },
        });

        const forecasts: ForecastDay[] = [];
        for (let i = 0; i < response.data.list.length; i += 8) {
          const dayData = response.data.list[i];
          forecasts.push({
            date:
              dayData.dt_txt?.split(" ")[0] ??
              new Date().toISOString().split("T")[0],
            temperature: dayData.main.temp,
            conditions: dayData.weather[0].description,
          });
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(forecasts, null, 2),
            },
          ],
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return {
            content: [
              {
                type: "text",
                text: `날씨 API 오류: ${
                  error.response?.data.message ?? error.message
                }`,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }
}

const server = new WeatherServer();
server.run();
