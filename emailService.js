/**
 * Presso Coffee Cart - Serviciu Trimitere Notificări Email
 * Trimitere automată către pressocoffeecart@yahoo.com cu sistem de fallback (multi-provider)
 */

const TARGET_EMAIL = 'pressocoffeecart@yahoo.com'

// Listă de endpoint-uri de încredere cu comutare automată în caz de eroare/timeout
const ENDPOINTS = [
    // 1. ShipMyForm - Endpoint activ, latență mică, fără căderi Cloudflare 522
    `https://shipmyform.com/to/${TARGET_EMAIL}`,
    // 2. FormSubmit - Fallback secundar (cu timeout strict de 3.5 secunde)
    `https://formsubmit.co/ajax/${TARGET_EMAIL}`
]

/**
 * Execută trimiterea către un endpoint cu timeout strict
 */
async function sendWithTimeout(url, payload, timeoutMs = 4000) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        })
        clearTimeout(timer)

        if (response.ok) {
            const data = await response.json().catch(() => ({ ok: true }))
            return { success: true, data, endpoint: url }
        }
        return { success: false, status: response.status, endpoint: url }
    } catch (err) {
        clearTimeout(timer)
        return { success: false, error: err.name === 'AbortError' ? 'Timeout' : err.message, endpoint: url }
    }
}

/**
 * Trimite payload-ul către primul endpoint disponibil
 */
async function dispatchEmail(payload) {
    // Permite configurarea unui endpoint custom din variabile de mediu dacă se dorește
    const customEndpoint = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_EMAIL_ENDPOINT) 
        || (typeof localStorage !== 'undefined' && localStorage.getItem('presso_email_endpoint'))

    const targetList = customEndpoint ? [customEndpoint, ...ENDPOINTS] : ENDPOINTS

    for (const endpoint of targetList) {
        try {
            const result = await sendWithTimeout(endpoint, payload, 4000)
            if (result.success) {
                console.info(`Notificare email livrată cu succes prin: ${endpoint}`)
                return result
            }
            console.warn(`Endpoint-ul ${endpoint} nu a răspuns corespunzător:`, result)
        } catch (e) {
            console.warn(`Eroare la apelul către ${endpoint}:`, e)
        }
    }

    console.error('Toate endpoint-urile de email au eșuat. Verifică panoul de administrare Supabase pentru comenzi/cereri.')
    return { success: false }
}

/**
 * Trimite notificare email pentru comenzi de doze la domiciliu
 */
export async function sendDozeOrderEmail(order) {
    const subject = `Comandă Doze #${order.orderId} - ${order.nume} (${order.totalCans} doze · ${order.totalPrice} lei)`
    
    const payload = {
        _subject: subject,
        _replyto: order.email,
        _template: 'table',
        _captcha: 'false',
        _gotcha: '', // Honeypot anti-spam

        // Câmpuri standard pentru clienți de email
        name: order.nume,
        email: order.email,
        phone: order.telefon,
        message: `Comandă Doze #${order.orderId}: ${order.totalCans} doze, total ${order.totalPrice} lei. Adresă: ${order.adresa}. Livrare: ${order.dataLivrare} (${order.oraLivrare}). Plată: ${order.metodaPlataText}. Detalii: ${order.selectedDrinksList}`,

        // Structură tabelară detaliată
        'Tip Solicitare': 'Comandă Doze Gata Ambalate la Domiciliu',
        'ID Comandă': `#${order.orderId}`,
        'Nume Client': order.nume,
        'Număr Telefon': order.telefon,
        'Email Client': order.email,
        'Adresă Livrare': order.adresa,
        'Data Livrării': order.dataLivrare,
        'Interval Orar': order.oraLivrare,
        'Total Doze': `${order.totalCans} buc`,
        'Total de Plată': `${order.totalPrice} lei`,
        'Metodă de Plată': order.metodaPlataText,
        'Status Plată': order.metodaPlata === 'cash' 
            ? 'DE ÎNCASAT CASH LA LIVRARE (RAMBURS)' 
            : 'TRANSFER BANCAR (Așteaptă OP / confirmare plată)',
        'Detaliere Doze': order.selectedDrinksList,
        'Mențiuni Speciale': order.mentiuni || 'Fără mențiuni speciale',
        'Data Înregistrării': new Date().toLocaleString('ro-RO')
    }

    return await dispatchEmail(payload)
}

/**
 * Trimite notificare email pentru cereri ofertă Coffee Cart Eveniment
 */
export async function sendOfferEmail(oferta) {
    const subject = `Cerere Ofertă Eveniment - ${oferta.nume} (${oferta.data || 'Fără dată'})`

    const payload = {
        _subject: subject,
        _replyto: oferta.email,
        _template: 'table',
        _captcha: 'false',
        _gotcha: '', // Honeypot anti-spam

        // Câmpuri standard
        name: oferta.nume,
        email: oferta.email,
        phone: oferta.telefon,
        message: `Cerere Ofertă Coffee Cart #${oferta.id}: ${oferta.nume}, tel: ${oferta.telefon}, data: ${oferta.data}, locație: ${oferta.locatie}, ${oferta.invitati} invitați. Cerințe: ${oferta.comentarii || 'Fără'}`,

        // Structură tabelară detaliată
        'Tip Solicitare': 'Cerere Ofertă Coffee Cart Eveniment',
        'ID Cerere': `#${oferta.id}`,
        'Nume Client': oferta.nume,
        'Număr Telefon': oferta.telefon,
        'Email Client': oferta.email,
        'Companie / Tip Eveniment': oferta.companie || 'Eveniment privat',
        'Locație Eveniment': oferta.locatie,
        'Data Eveniment': oferta.data,
        'Număr Invitați': `${oferta.invitati} persoane`,
        'Comentarii / Cerințe': oferta.comentarii || 'Fără cerințe suplimentare',
        'Data Solicitării': new Date().toLocaleString('ro-RO')
    }

    return await dispatchEmail(payload)
}
