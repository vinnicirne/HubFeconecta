const key = "AQ.Ab8RN6JwpIxJBIazX7dAsROyIiff0NcrdzUd6hwM1bD80fevRg";

async function run() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    if (data.models) {
      console.log("Modelos Disponiveis:");
      data.models.forEach(m => console.log(m.name, m.supportedGenerationMethods));
    } else {
      console.log("Erro:", data);
    }
  } catch (err) {
    console.error(err);
  }
}
run();
