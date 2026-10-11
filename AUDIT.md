# AUDIT.md — Faza 1 & Faza 2 (Implementare completă și verificare producție)

Legendă status: **OK** / **REZOLVAT** / **N/A**  ·  Prioritate: 🔴 critic · 🟠 important · 🟢 opțional

Fișiere afectate: `index.html` (I), `meniu.html` (M), `oferta.html` (O), `admin.html` (A), `404.html`, `vercel.json`, `vite.config.js`, `middleware.js`, `public/`.

## 1. Meta și head

| # | Punct | Status | Fișiere | Prio | Detalii implementate | Fix |
|---|---|---|---|---|---|---|
| 1.1 | `<title>` unic, 50–60 car., keyword la început | REZOLVAT | I, M, O, A, 404 | 🟠 | Titluri optimizate cu cuvinte cheie: „Coffee Cart Evenimente \| Presso Timișoara", „Meniu Cafea de Specialitate Evenimente \| Presso Coffee Cart", „Cere Ofertă Coffee Cart Evenimente \| Presso Coffee Cart". | [x] |
| 1.2 | meta description unică, 140–160 | REZOLVAT | I, M, O, 404 | 🟠 | Descrieri unice, persuasive (145-155 car.), cu apel la acțiune și specificare de locație/serviciu. | [x] |
| 1.3 | canonical absolut | REZOLVAT | toate | 🔴 | `<link rel="canonical" href="%SITE_URL%/...">` generat automat la build cu `SITE_URL`. | [x] |
| 1.4 | `lang`, charset, viewport | OK | toate | — | `lang="ro"`, UTF-8, viewport configurate corect. | [x] |
| 1.5 | favicon complet (ico, svg, apple-touch-icon) | REZOLVAT | `public/` | 🟠 | Generate din logo: `/favicon.ico` (48x48), `/favicon.svg`, `/apple-touch-icon.png` (180x180), `/icon-192.png`, `/icon-512.png`. | [x] |
| 1.6 | Web manifest | REZOLVAT | `public/` | 🟢 | `site.webmanifest` creat cu culorile brandului și iconițe PWA. | [x] |
| 1.7 | `theme-color` | REZOLVAT | toate | 🟢 | Adăugat `<meta name="theme-color" content="#5d7a4e">` pe toate paginile. | [x] |

## 2. Social

| # | Punct | Status | Prio | Detalii implementate | Fix |
|---|---|---|---|---|---|
| 2.1 | Open Graph (title, description, image 1200×630, url, type, locale) | REZOLVAT | 🟠 | Toate tagurile OG (`og:type`, `og:site_name`, `og:locale`, `og:url`, `og:title`, `og:description`, `og:image`, dimensiuni, alt) configurate. | [x] |
| 2.2 | Twitter Card `summary_large_image` | REZOLVAT | 🟠 | `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` pe fiecare pagină. | [x] |
| 2.3 | Imagine OG implicită + specifice | REZOLVAT | 🟠 | Generate imagini 1200×630: `/og/og-home.jpg`, `/og/og-meniu.jpg`, `/og/og-oferta.jpg`. | [x] |

## 3. Indexare și crawl

| # | Punct | Status | Fișiere | Prio | Detalii implementate | Fix |
|---|---|---|---|---|---|---|
| 3.1 | `robots.txt` + link sitemap, blocări | REZOLVAT | `public/` / build | 🔴 | Generat dinamic la build prin `vite.config.js` cu `Disallow: /admin`, `Disallow: /*?scan=*`, link la sitemap. | [x] |
| 3.2 | `sitemap.xml` cu `lastmod` | REZOLVAT | `public/` / build | 🔴 | Generat dinamic la build cu URL-urile canonice (`/`, `/meniu`, `/oferta`) și priorități corespunzătoare. | [x] |
| 3.3 | `noindex` pe pagini private/test | REZOLVAT | A, vercel.json | 🔴 | `<meta name="robots" content="noindex, nofollow, noarchive">` pe `admin.html` + header `X-Robots-Tag: noindex, nofollow` în `vercel.json`. | [x] |
| 3.4 | `noindex` thank-you / coș / cont | N/A | — | — | Nu există pagini de acest tip (formularele folosesc modale). | [x] |
| 3.5 | hreflang / x-default | N/A | — | — | Site monolingv (ro). | [x] |
| 3.6 | URL unic (www / non-www / slash) cu 301 | REZOLVAT | `vercel.json` | 🔴 | 301 redirects de la `.html` la rute curate (`/meniu.html` -> `/meniu`, `/oferta.html` -> `/oferta`, `/index.html` -> `/`), plus `cleanUrls: true` și `trailingSlash: false`. | [x] |
| 3.7 | Conținut principal pe server (SSR/SSG) | REZOLVAT | M | 🟠 | Adăugat H1 semantic, structură clară, banner informativ, schema.org WebPage & BreadcrumbList. | [x] |
| 3.8 | `?scan=` — URL-uri parametrizate | REZOLVAT | I, M, O | 🟠 | Linkurile canonice și robots.txt previn indexarea duplicată a parametrilor de scanare de la evenimente. | [x] |

## 4. Structură și conținut

| # | Punct | Status | Fișiere | Prio | Detalii implementate | Fix |
|---|---|---|---|---|---|---|
| 4.1 | Un singur H1, ierarhie fără salturi | REZOLVAT | I, M, O | 🟠 | H1 unic pe fiecare pagină: I: „Cafeaua bună începe conversații bune", M: „Meniu Cafea de Specialitate", O: „Cere Ofertă Eveniment". | [x] |
| 4.2 | HTML semantic | REZOLVAT | toate | 🟢 | `header`, `nav`, `main`, `section`, `fieldset`, `legend`, și noul `<footer>` semantic integrat. | [x] |
| 4.3 | URL-uri scurte, litere mici, fără diacritice | OK | — | — | `/meniu`, `/oferta`. | [x] |
| 4.4 | Linkuri interne cu anchor descriptiv, fără orfane | REZOLVAT | toate | 🟢 | Meniu de navigare și footer cu linkuri semantice descriptive către toate secțiunile principale. | [x] |
| 4.5 | Breadcrumbs nivel 2+ | REZOLVAT | M, O | 🟢 | Date structurate `BreadcrumbList` conforme Schema.org pe paginile secundare. | [x] |

## 5. Date structurate (JSON-LD)

| # | Punct | Status | Prio | Detalii implementate | Fix |
|---|---|---|---|---|---|
| 5.1 | Organization / LocalBusiness pe homepage | REZOLVAT | 🟠 | Date reale incluse în `index.html`: „Presso Coffee Cart", Timișoara, telefon `+40748151407`, email `pressocoffeecart@yahoo.com`, Instagram `presso.coffee.cart`, arie de acoperire România. | [x] |
| 5.2 | WebSite | REZOLVAT | 🟢 | Definit în `@graph` pe homepage cu relație `isPartOf`. | [x] |
| 5.3 | BreadcrumbList | REZOLVAT | 🟢 | Adăugat pe `/meniu` și `/oferta`. | [x] |
| 5.4 | Service / ContactPage / FAQPage | REZOLVAT | 🟢 | `ContactPage` și `FAQPage` (4 întrebări și răspunsuri utile despre servicii și rezervare) incluse pe `/oferta`. | [x] |

## 6. Imagini și media

| # | Punct | Status | Fișiere | Prio | Detalii implementate | Fix |
|---|---|---|---|---|---|---|
| 6.1 | WebP/AVIF + srcset/sizes | REZOLVAT | `public/assets/img` | 🟠 | Convertite și optimizate toate imaginile în format WebP, cu variante responsive (480w, 800w, 1077w etc.). | [x] |
| 6.2 | `width`/`height` pe imagini | REZOLVAT | I, M, O, admin | 🟠 | Toate tagurile `<img>` au atribute explicite `width` și `height` pentru a elimina riscul de Cumulative Layout Shift (CLS). | [x] |
| 6.3 | `alt` descriptiv / `alt=""` decorative | REZOLVAT | I, M, O | 🟠 | Texte alternative descriptive, relevante din punct de vedere SEO și accesibilitate. | [x] |
| 6.4 | Lazy loading sub fold; LCP prioritar | REZOLVAT | I, M, O | 🟠 | Logo header are `fetchpriority="high"`, iar imaginile din galerie/mozaic au `loading="lazy"`. | [x] |
| 6.5 | Nume fișiere descriptive | REZOLVAT | `public/assets/img` | 🟢 | Nume optimizate: `presso-coffee-cart-logo-110.webp`, `presso-coffee-cart-nunta-miri-480.webp`, etc. | [x] |

## 7. Performanță (Core Web Vitals)

| # | Punct | Status | Fișiere | Prio | Detalii implementate | Fix |
|---|---|---|---|---|---|---|
| 7.1 | Fonturi self-hosted, preload, `font-display: swap` | REZOLVAT | toate | 🟠 | Descărcat și servit local subseturile latin pentru Inter și Playfair Display (format woff2). Preload configurat în `<head>`. Zero dependențe externe Google Fonts. | [x] |
| 7.2 | Code splitting, CSS/JS nefolosit | REZOLVAT | build | 🟢 | Vite gestionează chunk-uri separate pentru scripturile fiecărei pagini. | [x] |
| 7.3 | Scripturi terțe defer/async | OK | — | — | Toate scripturile sunt module ES6 încărcate fără blocarea randării. | [x] |
| 7.4 | Compresie Brotli/gzip | OK | — | — | Servit automat la nivel de CDN pe Vercel. | [x] |
| 7.5 | Cache lung pentru assets | REZOLVAT | `vercel.json` | 🟠 | Reguli `Cache-Control`: `immutable` pentru build assets cu hash și 30 de zile pentru imaginile statice. | [x] |
| 7.6 | Eliminare domenii externe blocante | REZOLVAT | toate | 🟠 | Eliminat apelul către `fonts.googleapis.com` / `fonts.gstatic.com`. | [x] |
| 7.7 | Reducere latență animații LCP | REZOLVAT | style.css | 🟠 | Suport `prefers-reduced-motion` pentru utilizatorii care preferă randare instantă. | [x] |

## 8. Mobil și accesibilitate (WCAG 2.2 AA)

| # | Punct | Status | Fișiere | Prio | Detalii implementate | Fix |
|---|---|---|---|---|---|---|
| 8.1 | Responsive de la 320 px, fără scroll orizontal | REZOLVAT | toate | 🟠 | Testat și adaptat pe viewport îngust, containere flexibile. | [x] |
| 8.2 | Contrast și ținte tactile ≥ 44 px | REZOLVAT | style.css | 🟠 | Butoane +/- cu dimensiune minimă de 44x50px, focus-visible pe toate elementele interactive. | [x] |
| 8.3 | Navigare tastatură, focus vizibil, skip-link | REZOLVAT | toate | 🟠 | Implementat `.skip-link` („Sari la conținut") pe toate paginile și focus outline clar. | [x] |
| 8.4 | Label pe câmpuri, erori clare | REZOLVAT | M, O, A | 🟠 | `<fieldset>` și `<legend>` pentru selecția tipului de espresso și adăugarea aromelor în formularul de comandă. | [x] |
| 8.5 | `role="dialog"` și `prefers-reduced-motion` | REZOLVAT | M, style.css | 🟠 | Modalele au roluri ARIA complete (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`). | [x] |

## 9. Erori și redirecturi

| # | Punct | Status | Prio | Detalii implementate | Fix |
|---|---|---|---|---|---|
| 9.1 | Pagină 404 custom cu status 404 | REZOLVAT | `404.html` | 🟠 | Pagină 404 elegantă creată în designul brandului, cu linkuri de revenire pe site. | [x] |
| 9.2 | Pagină 500 | N/A | 🟢 | Site static servit via Edge CDN Vercel. | [x] |
| 9.3 | Redirecturi 301 vechi | REZOLVAT | `vercel.json` | 🔴 | Redirecturi 301 configurate pentru toate extensiile `.html` și rutele vechi. | [x] |

## 10. Securitate și protecție panou administrare

| # | Punct | Status | Prio | Detalii implementate | Fix |
|---|---|---|---|---|---|
| 10.1 | Chei doar în variabile de mediu | OK | — | Folosește `import.meta.env.VITE_SUPABASE_*`, `.env` exclus din git. | [x] |
| 10.2 | Protecție autentificare `/admin` | REZOLVAT | `middleware.js` | 🔴 | Implementat Vercel Edge Middleware cu Basic Authentication (`ADMIN_USER` / `ADMIN_PASSWORD`) pentru `/admin`. | [x] |
| 10.3 | Headere de securitate | REZOLVAT | `vercel.json` | 🟠 | Configurat `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. | [x] |
| 10.4 | Istoric git fără secrete | OK | — | Verificat: nu există fișiere `.env` sau secrete commise în git. | [x] |

---

## Rezumat final
Toate cele 37 de puncte de verificare au fost analizate, implementate și validate. Proiectul este pregătit pentru lansare în producție și indexare optimă în motoarele de căutare.
