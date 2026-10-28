PROJECT EXTRA — Phase 1 PWA starter files

Add these two files to the ROOT of the GitHub repository:
- manifest.json
- service-worker.js

Then edit index.html in the <head> section, immediately before </head>, to add:

<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0F172A">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Project EXTRA">

Before the closing </body> tag, add:

<script>
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js")
        .then(() => console.log("Project EXTRA offline shell registered"))
        .catch((error) => console.error("Service worker registration failed:", error));
    });
  }
</script>

Important:
- Do not replace the existing index.html with a newly generated page.
- This phase caches the app shell and best-effort caches the current Tailwind/Lucide CDN scripts.
- This does NOT yet provide offline DLL autosave, secure login, account synchronization, or approval workflow. Those are later phases.
- Test after deployment using HTTPS. Open the website while online first, then reload it once; only then test offline.
- If the app's hosted path changes from the domain root, the leading "/" paths in these files must be adjusted.
