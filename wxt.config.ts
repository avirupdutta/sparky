import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  entrypointsDir: "../entrypoints",
  modules: ["@wxt-dev/module-react"],
  manifestVersion: 3,
  dev: {
    server: {
      host: "127.0.0.1",
      origin: "http://127.0.0.1:3000",
      port: 3000,
      strictPort: true
    }
  },
  manifest: {
    name: "Sparky Autocomplete",
    description: "Inline autocomplete scaffold for local LLM-powered writing suggestions.",
    permissions: ["storage"],
    host_permissions: ["http://localhost/*", "http://127.0.0.1/*"]
  },
  webExt: {
    startUrls: ["https://www.google.com"]
  }
});
