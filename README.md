# UPI payment links

Shallowtail creates and shares UPI payment links. The homepage is `index.html`,
`setup.html` stores merchant UPI ID, name, and contact email in browser
`localStorage`, and `generate.html` creates a payment page. The Vercel function
at `/api/payment` renders that page with an app-opening UPI link and QR code.
Merchant details remain in the current browser and are included in each link.

After creating a link, use the share button to open the device's share sheet or
copy the link to the clipboard.

The payment details are Base64-encoded into the payment URL, so no database or
payment record is created. Base64 is not encryption: anyone with the link can
decode its payment details. When no merchant name is provided, the UPI ID is
shown as the name.
