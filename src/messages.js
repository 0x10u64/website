import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { randomUUID } from "node:crypto";

export async function messages(request, env) {
  const url = new URL(request.url);

  const s3 = new S3Client({
    region: "eu-central-003",
    endpoint: "https://s3.eu-central-003.backblazeb2.com",
    credentials: {
      accessKeyId: env.B2_KEY_ID,
      secretAccessKey: env.B2_APPLICATION_KEY,
    },
  });

  if (request.method === "GET") {
    const providedPassword = url.searchParams.get("password");

    if (!env.ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured: no password set" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (providedPassword !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const { results } = await env.DB.prepare(
        `
          SELECT id, author, content, file_name, created_at
          FROM messages
          ORDER BY created_at DESC
          LIMIT 16
        `,
      ).all();

      const messages = await Promise.all(
        results.map(async (message) => {
          let file_url = null;

          if (message.file_name) {
            const command = new GetObjectCommand({
              Bucket: "website-b2",
              Key: message.file_name,
            });

            file_url = await getSignedUrl(s3, command, {
              expiresIn: 60,
            });
          }

          return {
            ...message,
            file_url,
          };
        }),
      );

      return new Response(JSON.stringify({ messages }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Error fetching messages:", err);
      return new Response(
        JSON.stringify({ error: "Failed to fetch messages" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const formData = await request.formData();

    const rawAuthor = formData.get("author");
    const author =
      rawAuthor && rawAuthor.toString().trim() !== ""
        ? rawAuthor.toString().trim()
        : null;

    const rawContent = formData.get("content");
    const content = rawContent ? rawContent.toString().trim() : null;

    const file = formData.get("file");

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Message must have content" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    let fileName = null;
    if (file && typeof file === "object" && file.name) {
      fileName = `${randomUUID()}-${file.name}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: "website-b2",
          Key: fileName,
          Body: await file.arrayBuffer(),
          ContentType: file.type,
        }),
      );
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();

    const message = await env.DB.prepare(
      `
        INSERT INTO messages (id, author, content, file_name, created_at)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id, author, content, file_name, created_at
      `,
    )
      .bind(id, author, content, fileName, createdAt)
      .run();

    return new Response(JSON.stringify({ message }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
