import index from "../pages/index.html";
import mailbox from "../pages/mailbox.html";

import { messages } from "../src/messages";
import { meow } from "../src/meow";

export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname;

    let content;

    switch (pathname) {
      case "/":
        content = index;
        break;
      case "/mailbox":
        content = mailbox;
        break;
      case "/functions/messages":
        return messages(request, env);
      case "/functions/meow":
        return meow(request, env);
    }

    if (content) {
      const limit = 5;
      const params = new URLSearchParams({
        method: "user.getrecenttracks",
        user: env.LAST_FM_USERNAME,
        api_key: env.LAST_FM_API_KEY,
        format: "json",
        limit: String(limit),
      });

      const lastfmResponse = await fetch(
        `https://ws.audioscrobbler.com/2.0/?${params}`,
      );

      const tracks = await lastfmResponse.json();
      const tracksHtml = tracks.recenttracks.track
        .slice(0, limit)
        .map(
          (track, index) =>
            `<span><code>${index + 1}.</code> <a href="${track.url}">${track.artist["#text"]} - ${track.name}</a></span>`,
        )
        .join("");

      content = content.replace("{tracks}", tracksHtml);

      let meows;

      try {
        const result = await env.DB.prepare(
          `
            SELECT value
            FROM kv_store
            WHERE key = 'meows'
          `,
        ).first();

        meows = result.value;
      } catch (err) {
        meows = "Unsure, try reloading";
      } finally {
        content = content.replace("{meows}", meows);
      }

      return new Response(content, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
