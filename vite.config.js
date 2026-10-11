import { defineConfig, loadEnv } from 'vite'
import { execSync } from 'node:child_process'

// Domeniul final se setează din variabila de mediu SITE_URL (ex. în Vercel → Settings → Environment Variables).
// TODO: setează SITE_URL=https://domeniul-tau.ro înainte de lansare; până atunci se folosește placeholder-ul de mai jos.
const DEFAULT_SITE_URL = 'https://exemplu.ro'

// Pagini indexabile (intră în sitemap.xml). `/admin` și `/404` sunt excluse intenționat.
const INDEXABLE_PAGES = [
    { path: '/', file: 'index.html', priority: '1.0', changefreq: 'monthly' },
    { path: '/meniu', file: 'meniu.html', priority: '0.8', changefreq: 'weekly' },
    { path: '/oferta', file: 'oferta.html', priority: '0.9', changefreq: 'monthly' },
]

// Data ultimei modificări a fișierului sursă (din git); dacă nu există istoric git, data build-ului.
function lastModified(file) {
    try {
        const date = execSync(`git log -1 --format=%cs -- ${file}`, { stdio: ['ignore', 'pipe', 'ignore'] })
            .toString()
            .trim()
        if (date) return date
    } catch {
        // fără git disponibil -> fallback
    }
    return new Date().toISOString().slice(0, 10)
}

function seoPlugin(siteUrl) {
    return {
        name: 'presso-seo',

        // Înlocuiește %SITE_URL% în toate paginile HTML (canonical, og:url, JSON-LD etc.)
        transformIndexHtml: {
            order: 'pre',
            handler: (html) => html.replaceAll('%SITE_URL%', siteUrl),
        },

        // Generează sitemap.xml și robots.txt la build, cu domeniul curent
        generateBundle() {
            const urls = INDEXABLE_PAGES.map(
                (p) =>
                    `  <url>\n    <loc>${siteUrl}${p.path === '/' ? '/' : p.path}</loc>\n    <lastmod>${lastModified(p.file)}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
            ).join('\n')

            this.emitFile({
                type: 'asset',
                fileName: 'sitemap.xml',
                source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
            })

            this.emitFile({
                type: 'asset',
                fileName: 'robots.txt',
                source: [
                    'User-agent: *',
                    'Allow: /',
                    'Disallow: /admin',
                    '',
                    `Sitemap: ${siteUrl}/sitemap.xml`,
                    '',
                ].join('\n'),
            })
        },
    }
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const siteUrl = (env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
    if (siteUrl === DEFAULT_SITE_URL) {
        console.info(`[seo] SITE_URL nesetat -> folosesc placeholder ${DEFAULT_SITE_URL} (TODO: setează domeniul final)`)
    }

    return {
        plugins: [seoPlugin(siteUrl)],
        build: {
            rollupOptions: {
                input: {
                    main: 'index.html',
                    menu: 'meniu.html',
                    offer: 'oferta.html',
                    admin: 'admin.html',
                    notFound: '404.html',
                },
            },
        },
    }
})
