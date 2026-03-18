(function injectVercelAnalytics() {
  const hostname = window.location.hostname;
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local");

  if (isLocalhost) {
    return;
  }

  const scriptSrc = "/_vercel/insights/script.js";
  if (document.head.querySelector(`script[src="${scriptSrc}"]`)) {
    return;
  }

  const script = document.createElement("script");
  script.src = scriptSrc;
  script.defer = true;
  script.dataset.sdkn = "@vercel/analytics";
  script.dataset.sdkv = "2.0.1";
  script.onerror = function handleAnalyticsLoadError() {
    console.log(
      "[Vercel Web Analytics] Failed to load the analytics script. Enable Web Analytics in the Vercel project settings and redeploy."
    );
  };

  document.head.appendChild(script);
})();
