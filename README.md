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

## Real-time upload updates

Shared upload metadata and live notifications use Cloud Firestore. In the Firebase
project configured for this app:

1. Create a Firestore database.
2. In Authentication > Sign-in method, enable **Anonymous** sign-in.
3. Publish the rules from [`firestore.rules`](./firestore.rules) in Firestore
   Database > Rules.

Uploads made before this feature was enabled remain local to the browser. New
Google Drive uploads and linked Drive documents are shared with other open app
sessions. File contents stay in Google Drive; only document metadata is synced.
