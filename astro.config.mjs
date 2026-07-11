// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	// INTERIM: no custom domain purchased yet, so Pages serves this as a
	// project site under /foundry/, not the domain root. `site` + `base`
	// both need to reflect that or every absolute-root asset link (favicons,
	// Astro's own bundled chunks) 404s. Revert to `site:
	// 'https://abhijitbansal.com'` and drop `base` once DNS/CNAME is live —
	// see the matching TODO comments in BaseLayout.astro/404.astro/CNAME.
	site: 'https://abhijitbansal.github.io/foundry/',
	// Trailing slash matters: import.meta.env.BASE_URL echoes this value
	// verbatim (no auto-added slash) and every hand-written asset href in
	// BaseLayout.astro/404.astro concatenates `${BASE_URL}filename` assuming
	// BASE_URL already ends in `/` — omit it here and those hrefs collapse
	// into `/foundryfavicon.svg` (missing separator), a real 404.
	base: '/foundry/',
	integrations: [sitemap()],
});
