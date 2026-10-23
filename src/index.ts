import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export class MyMCP extends McpAgent<any> {
  server = new McpServer({ name: "Image Generator", version: "1.0.0" });

  async init() {
    this.server.tool(
      "generate_image",
      "Generate an image from a text prompt",
      { prompt: z.string() },
      async ({ prompt }) => {
        const form = new FormData();
        form.append("prompt", prompt);
        form.append("width", "1024");
        form.append("height", "1024");
        const formResponse = new Response(form);
        const res: any = await this.env.AI.run(
          "@cf/black-forest-labs/flux-2-dev",
          {
            multipart: {
              body: formResponse.body,
              contentType: formResponse.headers.get("content-type"),
            },
          }
        );
        return {
          content: [{ type: "image", data: res.image, mimeType: "image/jpeg" }],
        };
      }
    );
  }
}

export default {
  fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);
    if (url.pathname === "/mcp") return MyMCP.serve("/mcp").fetch(request, env, ctx);
    return new Response("Not found", { status: 404 });
  },
};
