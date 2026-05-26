async function run() {
  const url = "https://grants.projectcues.com/login";
  const actionId = "402c249efe42a21f05396310c720b8ee925ca7fef3";
  const email = "lloydpearson@projectcues.com";
  const password = "Pearson4$";

  console.log("Sending login request to live server...");
  
  // Construct multi-part form data manually
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  let body = "";
  
  // Append email
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="email"\r\n\r\n`;
  body += `${email}\r\n`;
  
  // Append password
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="password"\r\n\r\n`;
  body += `${password}\r\n`;

  // Append Next.js action marker (if needed, but Next-Action header is the primary one)
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="$ACTION_ID_${actionId}"\r\n\r\n`;
  body += `\r\n`;
  
  body += `--${boundary}--\r\n`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Next-Action": actionId,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Accept": "text/x-component"
      },
      body: body
    });

    console.log("Response Status:", res.status);
    console.log("Response Headers:");
    for (const [key, value] of res.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    const text = await res.text();
    console.log("\nResponse Body:");
    console.log(text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

run();
