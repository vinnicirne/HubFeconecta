const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3ODIxMjgzNDYsImV4cCI6MjA5NzcwNDM0Nn0.Kkqjs-m99ajaPjKLf2ghdtZFosNHoYaxeP-GdJVTsy4";

async function run() {
  const query = `INSERT INTO storage.buckets (id, name, public) VALUES ('reels', 'reels', true) ON CONFLICT (id) DO NOTHING;`;

  try {
    // node fetch for Node 18+ uses native fetch, but we can just use native fetch directly since node is > 18.
    const res = await fetch('http://209.50.229.10:8000/pg/query', {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch(e) {
    console.error("Error:", e);
  }
}

run();
