const APP_ID = '2062984881273778';
const APP_SECRET = 'e895711b40fd2a284e89d73901a15516';
const PAGE_TOKEN = 'EAAdURhkGe7IBSGLMzvWNxZAmBhIqViasmc29L0OnG9yQMaOZBL3Wnb5Vpb3BdI75QhZCvQePDy0DimUupcacOEZAyt9ZCeCRBCQoNf2yqMdUAhb3IzdnSlI1vaudPXBo8XZB90qNXwnZBh3v8RQ4DmP3BAY88TkJ5Qbo8kJBxI7m6oUSs2ZCO5kZB50R5uKVJ5d96XjOMy1Ag';

async function debug() {
  const appToken = `${APP_ID}|${APP_SECRET}`;
  console.log("Debugando o Token da Página...");
  const res = await fetch(`https://graph.facebook.com/v20.0/debug_token?input_token=${PAGE_TOKEN}&access_token=${appToken}`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

debug();
