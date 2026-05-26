const token = "QW9Iy6cLMXBKyOsPEcnWYe2pgRJvaazAi1DOiGyud6c87d76";
const username = "u198287421";

async function makeRequest(domain, buildUuid) {
  const endpoint = `/api/hosting/v1/accounts/${username}/websites/${domain}/nodejs/builds/${buildUuid}/logs`;
  console.log(`\nQuerying logs for ${domain} build ${buildUuid}: ${endpoint}`);
  const res = await fetch(`https://developers.hostinger.com${endpoint}`, {
    headers: { 
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  });
  console.log("Status:", res.status);
  try {
    const data = await res.json();
    console.log("Logs content:");
    console.log(data.data || data);
  } catch (err) {
    console.log(await res.text());
  }
}

async function run() {
  await makeRequest("grants.projectcues.com", "019e5fe9-22cd-7211-9287-1757f4f19fc5");
  await makeRequest("contracts.projectcues.com", "019e5fec-f780-70ed-9b69-6029e4f69477");
}

run();
