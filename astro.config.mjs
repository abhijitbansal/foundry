// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	// Custom domain live (public/CNAME + Squarespace DNS + GitHub Pages
	// settings) — site now serves at the domain root, no /foundry/ subpath.
	site: 'https://abhijitbansal.com',
	base: '/',
	// react() scoped to the harness page's Switchyard island — every other
	// component on the site is plain Astro/TS, no client framework.
	integrations: [sitemap(), react()],
});
