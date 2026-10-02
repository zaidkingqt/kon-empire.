import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://vectorforge.dev',
  server: {
    host: true,
  },
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    plugins: [
      tailwindcss(),
    ],
    server: {
      allowedHosts: true,
    },
    ssr: {
      noExternal: ['lucide-react', 'svgo'],
    },
    optimizeDeps: {
      include: ['svgo', 'dompurify', 'lucide-react'],
    },
  },
});
