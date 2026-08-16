const url = "http://209.50.229.10:8000/pg/query";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3ODIxMjgzNDYsImV4cCI6MjA5NzcwNDM0Nn0.Kkqjs-m99ajaPjKLf2ghdtZFosNHoYaxeP-GdJVTsy4";

const query = `SELECT * FROM information_schema.tables WHERE table_name = 'automations' OR table_name = 'inbox_messages';`;

async function run() {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "apikey": apikey,
        "Authorization": `Bearer ${apikey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (e) {
    console.error(e);
  }
}
run();
