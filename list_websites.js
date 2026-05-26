const token = "QW9Iy6cLMXBKyOsPEcnWYe2pgRJvaazAi1DOiGyud6c87d76";

async function run() {
  const res = await fetch("https://developers.hostinger.com/api/hosting/v1/websites?per_page=100", {
    headers: { 
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  });
  if (!res.ok) {
    console.log("Error:", res.status, await res.text());
    return;
  }
  const data = await res.json();
  console.log(`Total websites: ${data.data.length}`);
  const filtered = data.data.filter(w => w.domain.includes("projectcues") || w.domain.includes("grants") || w.domain.includes("contracts"));
  console.log(JSON.stringify(filtered, null, 2));
}

run();
