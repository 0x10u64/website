document.addEventListener("DOMContentLoaded", () => {
  const messageForm = document.getElementById("messageForm");
  const messageFormStatus = document.getElementById("messageFormStatus");
  const messageFileSpan = document.getElementById("messageFileSpan");

  document
    .getElementById("messageFileCheck")
    .addEventListener("change", function () {
      messageFileSpan.classList.toggle("hidden");
    });

  messageForm.reset();
  messageForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    messageFormStatus.textContent = "Sending...";

    try {
      const response = await fetch("/functions/messages", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error || `Request failed with status ${response.status}`,
        );
      }

      form.reset();
      messageFileSpan.classList.add("hidden");

      messageFormStatus.textContent = "Message sent!";
    } catch (err) {
      messageFormStatus.textContent = `Error: ${err.message}`;
    }
  });
});
