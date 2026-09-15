document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("messages");
  const password = new URLSearchParams(window.location.search).get("password");

  try {
    const response = await fetch(
      `/functions/messages?password=${password ?? ""}`,
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || `Request failed with status ${response.status}`,
      );
    }

    container.replaceChildren();
    data.messages.forEach((message, index) => {
      if (index > 0) {
        container.append(document.createElement("hr"));
      }

      const section = document.createElement("section");

      const text = document.createElement("pre");
      text.style.whiteSpace = "pre-wrap";

      const timestamp = new Date(message.created_at).toUTCString();

      text.textContent = `From ${message.author || "Anonymous"}\nat ${timestamp}:\n\n${message.content}`;
      section.append(text);

      if (message.file_url) {
        const img = document.createElement("img");
        img.src = message.file_url;
        img.style.maxWidth = "16rem";
        img.style.maxHeight = "16rem";
        section.append(img);
      }

      section.append(document.createElement("br"));

      const a = document.createElement("a");
      a.href = "/";
      a.textContent = "0x10u64.pages.dev";
      a.style.fontFamily = "monospace";
      a.style.color = "#00f";
      a.style.textDecorationColor = "#00f";
      section.append(a);

      container.append(section);
    });
  } catch (err) {
    const message = document.createElement("code");
    message.textContent = err.message;
    container.replaceChildren(message);
  }
});
