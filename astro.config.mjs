// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	// Custom domain live (public/CNAME + Squarespace DNS + GitHub Pages
	// settings) — site now serves at the domain root, no /foundry/ subpath.
	site: 'https://abhijitbansal.com',
	base: '/',
	integrations: [sitemap()],
});
