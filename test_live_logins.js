async function testLogin(domain, isLocal = false) {
  const loginUrl = isLocal ? `http://${domain}/login` : `https://${domain}/login`;
  console.log(`\n========================================`);
  console.log(`Testing login for: ${domain}`);
  console.log(`========================================`);

  console.log("Fetching login page to extract action ID...");
  const pageRes = await fetch(loginUrl);
  if (!pageRes.ok) {
    console.error(`Failed to fetch login page: ${pageRes.status}`);
    return;
  }
  
  const html = await pageRes.text();
  
  // Extract action ID using regex
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
  
  // Construct multi-part form data manually
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  let body = "";
  
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="email"\r\n\r\n`;
  body += `${email}\r\n`;
  
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="password"\r\n\r\n`;
  body += `${password}\r\n`;

  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="$ACTION_ID_${actionId}"\r\n\r\n`;
  body += `\r\n`;
  
  body += `--${boundary}--\r\n`;

  console.log("Sending simulated Server Action POST...");
  try {
    const res = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Next-Action": actionId,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Accept": "text/x-component",
        "Origin": isLocal ? `http://${domain}` : `https://${domain}`,
        "Referer": isLocal ? `http://${domain}/login` : `https://${domain}/login`
      },
      body: body
    });

    console.log("Response Status:", res.status);
    console.log("Response Headers:");
    for (const [key, value] of res.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    const text = await res.text();
    console.log("\nResponse Body (first 500 chars):");
    console.log(text.substring(0, 500));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

async function run() {
  await testLogin("localhost:3011", true);
}

run();
