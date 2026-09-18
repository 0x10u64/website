document.addEventListener("DOMContentLoaded", () => {
  const els = {
    messageForm: document.getElementById("messageForm"),
    messageFormStatus: document.getElementById("messageFormStatus"),
    messageFileSpan: document.getElementById("messageFileSpan"),
    meows: document.getElementById("meows"),
    meowButton: document.getElementById("meowButton"),
    meowMessage: document.getElementById("meowMessage"),
  };

  document
    .getElementById("messageFileCheck")
    .addEventListener("change", function () {
      els.messageFileSpan.classList.toggle("hidden");
    });

  els.messageForm.reset();
  els.messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    els.messageFormStatus.textContent = "Sending...";

    try {
      const response = await fetch("/functions/messages", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data?.error || `Request failed with status ${response.status}`,
        );
      }

      form.reset();
      els.messageFileSpan.classList.add("hidden");

      els.messageFormStatus.textContent = "Message sent!";
    } catch (err) {
      els.messageFormStatus.textContent = `Error: ${err.message}`;
    }
  });

  els.meowButton.addEventListener("click", async () => {
    els.meowMessage.textContent = "Sending meow...";

    try {
      const response = await fetch("/functions/meow", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data?.error || `Request failed with status ${response.status}`,
        );
      }

      const data = await response.json();
      els.meows.textContent = `Meows: ${data.meows}`;

      els.meowMessage.textContent = "";
    } catch (err) {
      els.meowMessage.textContent = `Error: ${err.message}`;
    }
  });
});
