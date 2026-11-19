# UPI payment links

Shallowtail creates and shares UPI payment links. The homepage is `index.html`,
`setup.html` stores merchant UPI ID, name, contact email, and an optional
WhatsApp or SMS delivery preference in browser `localStorage`, and
`generate.html` creates a payment page. The Vercel function at `/api/payment`
renders that page with an app-opening UPI link and QR code. Merchant details
remain in the current browser and are included in each link.

After creating a link, Shallowtail opens WhatsApp or the phone's SMS app with a
message and payment link prefilled if a delivery preference was selected. The
merchant must review and send the message; no message is sent automatically.
Without a preference, the device share sheet or clipboard is used. Customer
phone numbers are entered on the link-creation page and are not saved.
Created links also appear in `track.html`, where their paid/unpaid status can be
changed manually. The payment tracker is saved in the current browser's
`localStorage`; its status does not verify whether UPI received a payment.
Each generated link includes a short random reference, such as `ABCD-239`, in
the UPI transaction note (`tn`), reference (`tr`), and local tracker. The
merchant can use it to match a payment where the payer's UPI app and bank
statement preserve these fields; the reference does not confirm that a payment
cleared.

The app can be installed as a PWA. Its static app shell is cached for offline
access, while payment-link creation still requires a network connection.

The payment details are Base64-encoded into the payment URL, so no database or
payment record is created. Base64 is not encryption: anyone with the link can
decode its payment details. When no merchant name is provided, the UPI ID is
shown as the name.
