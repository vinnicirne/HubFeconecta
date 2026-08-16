async function testWebhook() {
  const url = "https://hubfeconecta.vercel.app/api/webhooks/meta";
  const payload = {
    object: "instagram",
    entry: [
      {
        id: "12345",
        time: 12345,
        changes: [
          {
            field: "comments",
            value: {
              from: {
                id: "98765",
                username: "fake_user"
              },
              id: "comment_123",
              text: "amém",
              media: { id: "media_123" }
            }
          }
        ]
      }
    ]
  };

  console.log("Enviando webhook falso para Vercel...");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Resposta:", text);
  } catch(e) {
    console.error(e);
  }
}
testWebhook();
