# UPI payment links

Shallowtail creates and shares UPI payment links. The homepage is `index.html`,
`setup.html` stores merchant UPI ID, name, and contact email in browser
`localStorage`, and `generate.html` creates a payment page. The Vercel function
at `/api/payment` renders that page with an app-opening UPI link and QR code.
Merchant details remain in the current browser and are included in each link.

After creating a link, use the share button to open the device's share sheet or
copy the link to the clipboard. Created links also appear in `track.html`, where
their paid/unpaid status can be changed manually. The payment tracker is saved in
the current browser's `localStorage`; its status does not verify whether UPI
received a payment.

The app can be installed as a PWA. Its static app shell is cached for offline
access, while payment-link creation still requires a network connection.

The payment details are Base64-encoded into the payment URL, so no database or
payment record is created. Base64 is not encryption: anyone with the link can
decode its payment details. When no merchant name is provided, the UPI ID is
shown as the name.
