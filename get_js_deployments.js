const token = "QW9Iy6cLMXBKyOsPEcnWYe2pgRJvaazAi1DOiGyud6c87d76";
const username = "u198287421";

async function makeRequest(domain) {
  const endpoint = `/api/hosting/v1/accounts/${username}/websites/${domain}/nodejs/builds`;
  const res = await fetch(`https://developers.hostinger.com${endpoint}`, {
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
  console.log(`\n--- Deployments for ${domain} (Total: ${data.data.length}) ---`);
  data.data.slice(0, 3).forEach((d, i) => {
    console.log(`[${i+1}] UUID: ${d.uuid}`);
    console.log(`    State: ${d.state}`);
    console.log(`    Created: ${d.created_at}`);
    console.log(`    Updated: ${d.updated_at}`);
    console.log(`    Options:`, JSON.stringify(d.options));
  });
}

async function run() {
  await makeRequest("grants.projectcues.com");
  await makeRequest("contracts.projectcues.com");
}

run();
