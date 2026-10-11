// Protecție cu parolă (HTTP Basic Auth) pentru panoul /admin — rulează pe Vercel înainte de a servi pagina.
// Credențialele se setează DOAR ca variabile de mediu în Vercel (Settings → Environment Variables):
//   ADMIN_USER      = numele de utilizator dorit
//   ADMIN_PASSWORD  = o parolă lungă și unică
// Dacă variabilele lipsesc, accesul la /admin este blocat (fail-closed), nu rămâne deschis.
//
// NOTĂ: aceasta protejează PAGINA de admin. Datele din Supabase rămân protejate doar de regulile RLS
// din Supabase — vezi secțiunea „Securitate" din AUDIT.md.

export const config = {
    matcher: ['/admin', '/admin.html'],
}

const NO_CACHE = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }

function safeEqual(a, b) {
    // comparare în timp aproape constant, ca să nu se poată deduce parola după timpul de răspuns
    if (a.length !== b.length) return false
    let diff = 0
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
    return diff === 0
}

export default function middleware(request) {
    const expectedUser = process.env.ADMIN_USER
    const expectedPass = process.env.ADMIN_PASSWORD

    if (!expectedUser || !expectedPass) {
        return new Response('Panoul de administrare este dezactivat: ADMIN_USER / ADMIN_PASSWORD nu sunt configurate.', {
            status: 503,
            headers: { ...NO_CACHE, 'Content-Type': 'text/plain; charset=utf-8' },
        })
    }

    const header = request.headers.get('authorization') || ''
    if (header.startsWith('Basic ')) {
        try {
            const decoded = atob(header.slice(6))
            const idx = decoded.indexOf(':')
            const user = decoded.slice(0, idx)
            const pass = decoded.slice(idx + 1)
            if (idx > -1 && safeEqual(user, expectedUser) && safeEqual(pass, expectedPass)) {
                // autentificat -> continuă spre pagina statică (echivalentul lui next() din @vercel/functions)
                return new Response(null, { headers: { 'x-middleware-next': '1' } })
            }
        } catch {
            // header malformat -> cade în 401
        }
    }

    return new Response('Autentificare necesară.', {
        status: 401,
        headers: {
            ...NO_CACHE,
            'Content-Type': 'text/plain; charset=utf-8',
            'WWW-Authenticate': 'Basic realm="Presso Admin", charset="UTF-8"',
        },
    })
}
