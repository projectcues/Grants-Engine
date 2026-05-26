const token = "QW9Iy6cLMXBKyOsPEcnWYe2pgRJvaazAi1DOiGyud6c87d76";
const username = "u198287421";
const domain = "grants.projectcues.com";
const buildUuid = "019e6192-a9ca-71ab-9e9b-05ea9ce15b8b";

async function checkStatus() {
  const endpoint = `/api/hosting/v1/accounts/${username}/websites/${domain}/nodejs/builds`;
  const res = await fetch(`https://developers.hostinger.com${endpoint}`, {
    headers: { 
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  });
  if (!res.ok) {
    console.log("Error:", res.status, await res.text());
    return null;
  }
  const data = await res.json();
  const build = data.data.find(b => b.uuid === buildUuid);
  return build ? build.state : null;
}

async function fetchLogs() {
  const endpoint = `/api/hosting/v1/accounts/${username}/websites/${domain}/nodejs/builds/${buildUuid}/logs`;
  const res = await fetch(`https://developers.hostinger.com${endpoint}`, {
    headers: { 
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  });
  if (res.ok) {
    const data = await res.json();
    console.log("\nBuild logs:");
    console.log(data.data || data);
  } else {
    console.log("Failed to fetch logs:", res.status);
  }
}

async function run() {
  console.log(`Monitoring build ${buildUuid} for ${domain}...`);
  for (let i = 0; i < 30; i++) {
    const state = await checkStatus();
    console.log(`Current state: ${state}`);
    if (state === "completed" || state === "failed") {
      console.log(`Build ended with state: ${state}`);
      await fetchLogs();
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

run();
