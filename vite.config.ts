import path from "path";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  // Determine base path based on repository name
  // This allows the same code to work for both staging and production
  const getBasePath = () => {
    if (process.env.NODE_ENV !== "production") return "/";

    // Check if we're in the staging repository
    const isStaging = process.cwd().includes("ShiftPal-staging");
    return isStaging ? "/ShiftPal-staging/" : "/ShiftPal/";
  };

  return {
    base: getBasePath(),
    plugins: [
      VitePWA({
        devOptions: {
          enabled: true,
        },
        registerType: "prompt",
        includeAssets: ["icons/*.png", "icons/shiftpal.svg", "favicon.svg"],
        manifest: {
          name: "ShiftPal",
          short_name: "ShiftPal",
          description: "ShiftPal — smarter shifts, anywhere.",
          start_url: "./",
          scope: "./",
          display: "standalone",
          background_color: "#374151",
          theme_color: "#374151",
          icons: [
            { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icons/icon-256.png", sizes: "256x256", type: "image/png" },
            { src: "icons/icon-384.png", sizes: "384x384", type: "image/png" },
            { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "icons/maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable any",
            },
          ],
        },
        workbox: {
          navigateFallback: `${getBasePath()}index.html`,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === "image",
              handler: "CacheFirst",
              options: {
                cacheName: "images",
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "fonts" },
            },
            {
              urlPattern: ({ url }) =>
                url.origin.includes("googleapis.com") ||
                url.origin.includes("firebaseio.com"),
              handler: "NetworkFirst",
              options: {
                cacheName: "api",
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
          ],
        },
      }),
    ],
    define: {
      // Legacy process.env support for compatibility
      "process.env.API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
