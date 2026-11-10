<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/713a0233-04ce-42c8-964f-4b143491fe15

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Google Drive upload notifications

The app checks the shared Google Drive folder for new files every 30 seconds.
Each user who wants notifications must select **Hubungkan Google Drive** in the
sidebar, approve the Drive metadata-read permission, and have access to the
shared folder. Notifications appear only while the app is open. File contents
remain in Google Drive; the app reads file metadata only.
