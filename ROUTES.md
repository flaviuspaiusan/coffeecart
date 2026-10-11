# ROUTES.md — Faza 0: Inventar

## Stack detectat

| Element | Valoare |
|---|---|
| Tip proiect | MPA (multi-page) HTML + JS vanilla, **fără framework** |
| Bundler | Vite 6 (`vite build`, 4 intrări în `vite.config.js`) |
| Backend / date | Supabase (`@supabase/supabase-js`), chei prin `import.meta.env.VITE_*` |
| Hosting | Vercel (`vercel.json`: rewrites + redirecturi) |
| Repo | github.com/flaviuspaiusan/coffeecart (branch cu deploy automat) |
| Randare | Pagini HTML statice (conținut principal în HTML = SSG-like). Meniul (`/meniu`) și panoul admin sunt populate din JS/Supabase (CSR) |
| Limbi | ro (un singur `lang="ro"`) |
| Domeniu final | **TODO – neconfirmat** (placeholder: `https://exemplu.ro`) |

## Rute

| URL (canonic dorit) | Fișier sursă | Tip pagină | Indexabilă | Observații |
|---|---|---|---|---|
| `/` | `index.html` | Homepage / prezentare | **DA** | Singura pagină cu conținut editorial |
| `/meniu` | `meniu.html` | Meniu + comandă online (conținut din JS) | **DA** (parțial) | Comenzile sunt active doar cu `?scan=...`; variantele cu query nu trebuie indexate separat |
| `/oferta` | `oferta.html` | Formular cerere ofertă (conversie) | **DA** | Pagină de lead-gen, are valoare de căutare ("coffee cart nuntă") |
| `/admin` | `admin.html` | Panou intern | **NU** | Trebuie `noindex` + blocat în robots + protecție acces |
| `/?scan=<token>` | `index.html` | Redirect 302 → `/meniu` | NU | Rută QR, redirect temporar (corect 302) |
| `/acasa`, `/acasa.html` | — | Redirect 301 → `/` | NU | OK în `vercel.json` |
| `/meniu.html`, `/oferta.html`, `/admin.html`, `/index.html` | fișiere statice | **Duplicate** ale rutelor curate | NU (ar trebui 301) | Accesibile direct → conținut duplicat, **fără redirect** |
| `/404` | — | **Lipsește** | NU | Vercel servește 404 generic |
| `/robots.txt`, `/sitemap.xml`, `/site.webmanifest`, favicon | — | **Lipsesc** | — | `public/` conține doar `assets/` |

## Fișiere statice (`public/assets`)
- 6 fotografii JPEG (`1–6.jpeg`), 4 fotografii JPG (`presso-*.jpg`), `logo.jpeg`
- ~20 imagini PNG meniu (≈ 0,5–0,85 MB fiecare, ≈ 12 MB total) — neoptimizate

## Linkuri interne actuale
- Nav pe toate paginile: `/`, `meniu.html`, `oferta.html` (relative, forma `.html`, nu cea canonică).
- `admin` nu e legat de nicăieri (corect), dar e accesibil prin URL direct.
