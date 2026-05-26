async function run() {
  const url = "https://grants.projectcues.com/api/engine/env-check";
  console.log(`Fetching diagnostics from ${url}...`);
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    if (res.ok) {
      const data = await res.json();
      console.log("Environment variables on server:");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log("Error:", await res.text());
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

run();
