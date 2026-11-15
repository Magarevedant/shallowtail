# UPI payment links

This project serves a small form for creating UPI payment links. The Vercel
function at `/api/payment` renders a payment page with an app-opening UPI link
and a QR code. The form accepts optional merchant name, contact email, and
payment note fields. `styles.css` and `payment.css` style the form and payment
page separately.

The amount and UPI ID are Base64-encoded into the payment URL, so no database
or payment record is created. Base64 is not encryption: anyone can decode the
values. When no merchant name is provided, the UPI ID is shown as the name.
