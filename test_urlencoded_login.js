async function run() {
  const domain = "localhost:3011";
  const loginUrl = `http://${domain}/login`;
  console.log(`Fetching login page from ${loginUrl} to extract action ID...`);
  const pageRes = await fetch(loginUrl);
  if (!pageRes.ok) {
    console.error(`Failed to fetch login page: ${pageRes.status}`);
    return;
  }
  const html = await pageRes.text();
  const actionRegex = /\$ACTION_ID_([a-f0-9]+)/;
  const match = html.match(actionRegex);
  if (!match) {
    console.error("Could not find Server Action ID in HTML!");
    return;
  }
  const actionId = match[1];
  console.log(`Extracted Action ID: ${actionId}`);

  const email = "lloydpearson@projectcues.com";
  const password = "Pearson4$";

  // Construct URL-encoded body
  const params = new URLSearchParams();
  params.append("email", email);
  params.append("password", password);
  params.append(`$ACTION_ID_${actionId}`, "");

  console.log("Sending POST with urlencoded body...");
  try {
    const res = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Next-Action": actionId,
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": `http://${domain}`,
        "Referer": `${loginUrl}`
      },
      body: params.toString()
    });

    console.log("Response Status:", res.status, res.statusText);
    console.log("Response Headers:", Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log("Response Body (first 500 chars):");
    console.log(text.substring(0, 500));
  } catch (err) {
    console.error("POST failed:", err);
  }
}

run();
