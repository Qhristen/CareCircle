# CareCircle web app

This is the CareCircle web client built with [Next.js](https://nextjs.org). It
is the public and organizer-facing client used to create and manage support
circles, review needs, contribute, and follow fulfillment.

## Getting Started

Configure the browser-facing services before starting the app:

```bash
NEXT_PUBLIC_API_URL=http://localhost:9000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-upload-preset
```

`NEXT_PUBLIC_API_URL` is the API origin. Do not include `/api/v1`; endpoint
paths already include the version prefix. Google and Cloudinary values are
optional; their respective sign-in and custom-cover upload controls remain
unavailable until configured.

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open http://localhost:3000 with your browser to see the app.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates
as you edit the file.

## Learn More

To learn more about Next.js and how this app is built, see the Next.js
documentation and tutorial:

- https://nextjs.org/docs
- https://nextjs.org/learn

## Deploy on Vercel

Deploy the web app to Vercel or another hosting provider; see the Next.js
deployment docs for details.
