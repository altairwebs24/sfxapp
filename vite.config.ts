import { defineConfig } from "@lovable.dev/vite-tanstack-config";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [cloudflare({
    viteEnvironment: {
      name: "ssr"
    }
  })],
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [],
    define: {
      "process.env.SUPABASE_URL": JSON.stringify("https://oircsgwujzrflpymustw.supabase.co"),
      "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcmNzZ3d1anpyZmxweW11c3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODg3NzQsImV4cCI6MjA5NTY2NDc3NH0.yEh1w1dn5c4n-6mbJEziP6-4drNp7bkqPZUFRX0S5VU"),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://oircsgwujzrflpymustw.supabase.co"),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcmNzZ3d1anpyZmxweW11c3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODg3NzQsImV4cCI6MjA5NTY2NDc3NH0.yEh1w1dn5c4n-6mbJEziP6-4drNp7bkqPZUFRX0S5VU"),
    },
  },
});