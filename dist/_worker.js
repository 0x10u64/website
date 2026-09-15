import index from "../pages/index.html";
import mailbox from "../pages/mailbox.html";

import { messages } from "../src/messages";

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

      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?${params}`,
      );

      const tracks = await response.json();
      const tracksHtml = tracks.recenttracks.track
        .slice(0, limit)
        .map(
          (track, index) =>
            `<span><code>${index + 1}.</code> <a href="${track.url}">${track.artist["#text"]} - ${track.name}</a></span>`,
        )
        .join("");

      content = content.replace("{tracks}", tracksHtml);

      return new Response(content, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
