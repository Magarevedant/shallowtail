const QRCode = require("qrcode");

function isValidPaymentData(data) {
  return typeof data.amount === "string"
    && /^\d+(?:\.\d{1,2})?$/.test(data.amount)
    && Number(data.amount) > 0
    && typeof data.upi_id === "string"
    && /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$/.test(data.upi_id)
    && typeof data.merchant_name === "string"
    && data.merchant_name.length <= 100
    && typeof data.email === "string"
    && data.email.length <= 254
    && (!data.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    && typeof data.note === "string"
    && data.note.length <= 140;
}

function encodePaymentData(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodePaymentData(token) {
  if (!token || token.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(token)) {
    throw new Error("Invalid payment link");
  }

  const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(paddedBase64), (character) => character.charCodeAt(0));
  const decoded = JSON.parse(new TextDecoder().decode(bytes));
  const data = {
    amount: decoded.amount,
    upi_id: decoded.upi_id,
    merchant_name: typeof decoded.merchant_name === "string" ? decoded.merchant_name : "",
    email: typeof decoded.email === "string" ? decoded.email : "",
    note: typeof decoded.note === "string" ? decoded.note : "",
  };

  if (!isValidPaymentData(data)) {
    throw new Error("Invalid payment link");
  }

  return data;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

module.exports = async (request, response) => {
  if (request.method === "POST") {
    const body = request.body || {};
    const amount = String(body.amount || "");
    const upiId = typeof body.upi_id === "string" ? body.upi_id.trim() : "";
    const data = {
      amount,
      upi_id: upiId,
      merchant_name: typeof body.merchant_name === "string" ? body.merchant_name.trim() : "",
      email: typeof body.email === "string" ? body.email.trim() : "",
      note: typeof body.note === "string" ? body.note.trim() : "",
    };

    if (!isValidPaymentData(data)) {
      return response.status(400).json({ error: "Check the amount, UPI ID, and optional details." });
    }

    const token = encodePaymentData(data);
    const query = new URLSearchParams({ data: token });
    response.setHeader("Cache-Control", "no-store");
    const paymentPath = `/api/payment?${query}`;
    return response.status(200).json({ url: paymentPath });
  }

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET, POST");
    return response.status(405).send("Method not allowed");
  }

  const requestUrl = new URL(request.url, "http://localhost");
  let paymentData;
  try {
    paymentData = decodePaymentData(requestUrl.searchParams.get("data"));
  } catch {
    return response.status(400).send("Invalid payment link.");
  }

  const { amount, upi_id: upiId, email, merchant_name: merchantName, note } = paymentData;
  const displayName = merchantName || upiId;
  const paymentUri = new URL("upi://pay");
  paymentUri.searchParams.set("pa", upiId);
  paymentUri.searchParams.set("pn", displayName);
  paymentUri.searchParams.set("am", amount);
  paymentUri.searchParams.set("cu", "INR");
  if (note) {
    paymentUri.searchParams.set("tn", note);
    paymentUri.searchParams.set("tr", note);
  }

  try {
    const qrCode = await QRCode.toDataURL(paymentUri.href);
    const safeUpiId = escapeHtml(upiId);
    const safeDisplayName = escapeHtml(displayName);
    const safeEmail = escapeHtml(email);
    const safeMailto = escapeHtml(`mailto:${encodeURIComponent(email)}`);
    const safeNote = escapeHtml(note);
    const safeAmount = escapeHtml(Number(amount).toFixed(2));
    const safePaymentUri = escapeHtml(paymentUri.href);
    const safeQrCode = escapeHtml(qrCode);

    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'self'; img-src data:; base-uri 'none'; frame-ancestors 'none'"
    );
    return response.status(200).send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pay ${safeDisplayName}</title>
    <link rel="stylesheet" href="/payment.css">
  </head>
  <script async src="https://www.googletagmanager.com/gtm.js?id=GTM-NG3C5HRN"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
</script>
  <body>
    <main class="payment-card">
      <p class="eyebrow">UPI payment request</p>
      <h1>${safeDisplayName}</h1>
      <p class="upi-id">UPI ID: ${safeUpiId}</p>
      ${note ? `<p class="note">Payment reference: ${safeNote}</p>` : ""}
      <p class="amount-label">Total to pay</p>
      <p class="amount">₹${safeAmount}</p>
      <a class="button" href="${safePaymentUri}">Open UPI app</a>
      <section class="qr-section" aria-labelledby="qr-title">
        <h2 id="qr-title">Scan to pay</h2>
        <p>Use any UPI app to scan this code.</p>
        <img class="qr-code" src="${safeQrCode}" alt="UPI payment QR code for ₹${safeAmount}">
      </section>
      ${email ? `<a class="contact" href="${safeMailto}">Questions? Contact ${safeEmail}</a>` : ""}
    </main>
    <footer class="site-footer">A Vedant Magare Production</footer>
  </body>
</html>`);
  } catch (error) {
    console.error("Could not generate payment QR code:", error);
    return response.status(500).send("Could not create the payment page.");
  }
};
