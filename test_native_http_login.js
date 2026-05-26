const http = require('http');

async function run() {
  const domain = "localhost:3011";
  const loginUrl = `http://${domain}/login`;
  console.log(`Fetching login page from ${loginUrl} to extract action ID...`);
  
  // GET request via fetch is fine
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

  // Construct multipart body manually
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  let parts = [];
  
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="email"\r\n\r\n${email}\r\n`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="password"\r\n\r\n${password}\r\n`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="$ACTION_ID_${actionId}"\r\n\r\n\r\n`);
  parts.push(`--${boundary}--\r\n`);

  const bodyBuffer = Buffer.concat(parts.map(p => Buffer.from(p)));

  console.log(`Sending POST via native http (body size: ${bodyBuffer.length} bytes)...`);
  
  const options = {
    hostname: 'localhost',
    port: 3011,
    path: '/login',
    method: 'POST',
    headers: {
      'Next-Action': actionId,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': bodyBuffer.length,
      'Origin': `http://${domain}`,
      'Referer': `${loginUrl}`,
      'Accept': 'text/x-component',
      'Connection': 'close'
    }
  };

  const req = http.request(options, (res) => {
    console.log("Response Status:", res.statusCode, res.statusMessage);
    console.log("Response Headers:", res.headers);
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
      const resBody = Buffer.concat(chunks).toString();
      console.log("Response Body (first 500 chars):");
      console.log(resBody.substring(0, 500));
    });
  });

  req.on('error', (err) => {
    console.error("HTTP request error:", err);
  });

  req.write(bodyBuffer);
  req.end();
}

run();
