async function run() {
  const path = "/home/u198287421/domains/grants.projectcues.com/nodejs/console.log";
  const url = `https://grants.projectcues.com/api/engine/logs?action=read&path=${encodeURIComponent(path)}`;
  console.log(`Reading log file from live server: ${path}`);
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    if (res.ok) {
      const text = await res.text();
      console.log("Log content:");
      console.log(text);
    } else {
      console.log("Error:", await res.text());
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

run();
