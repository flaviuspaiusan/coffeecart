/**
 * Presso Coffee Cart - Serviciu Trimitere Notificări (Email + Telegram + Supabase)
 * Asigură livrare garantată a comenzilor și cererilor de ofertă
 */

const TARGET_EMAIL = 'pressocoffeecart@yahoo.com'
const BACKUP_EMAIL = 'flaviuspaiusan77@gmail.com'

/**
 * Execută trimiterea către un endpoint HTTP cu timeout strict
 */
async function sendWithTimeout(url, payload, timeoutMs = 4500) {
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
 * Trimite notificare instantanee pe Telegram dacă botul este configurat
 */
export async function sendTelegramNotification(botToken, chatId, text) {
    if (!botToken || !chatId) return { success: false, error: 'Configurație Telegram incompletă' }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        })
        const data = await response.json()
        return { success: data.ok, data }
    } catch (err) {
        console.warn('Eroare notificare Telegram:', err)
        return { success: false, error: err.message }
    }
}

/**
 * Obține endpoint-ul configurat din Supabase sau LocalStorage
 */
async function getConfiguredNotificationEndpoint() {
    try {
        if (typeof localStorage !== 'undefined') {
            const local = localStorage.getItem('presso_notification_endpoint')
            if (local && local.trim()) return local.trim()
        }

        const { SupabaseService } = await import('./supabase.js')
        if (SupabaseService && typeof SupabaseService.getSetting === 'function') {
            const fromDb = await SupabaseService.getSetting('presso_notification_endpoint')
            if (fromDb && fromDb.trim()) return fromDb.trim()
        }
    } catch {}

    return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_EMAIL_ENDPOINT) || null
}

/**
 * Obține setările Telegram din Supabase sau LocalStorage
 */
async function getTelegramConfig() {
    try {
        if (typeof localStorage !== 'undefined') {
            const local = localStorage.getItem('presso_telegram_config')
            if (local) return JSON.parse(local)
        }

        const { SupabaseService } = await import('./supabase.js')
        if (SupabaseService && typeof SupabaseService.getSetting === 'function') {
            const fromDb = await SupabaseService.getSetting('presso_telegram_config')
            if (fromDb) return JSON.parse(fromDb)
        }
    } catch {}

    return null
}

/**
 * Trimite notificarea pe toate canalele disponibile
 */
async function dispatchNotification(emailPayload, telegramText) {
    let delivered = false

    // 1. Canalul Telegram (notificare PUSH pe telefon - instant și 100% sigură)
    try {
        const tg = await getTelegramConfig()
        if (tg && tg.botToken && tg.chatId) {
            const tgRes = await sendTelegramNotification(tg.botToken, tg.chatId, telegramText)
            if (tgRes.success) {
                console.info('Notificare trimisă cu succes pe Telegram!')
                delivered = true
            }
        }
    } catch (e) {
        console.warn('Eroare verificare Telegram:', e)
    }

    // 2. Canalul Formspree / Web3Forms configurat dedicat
    const customEndpoint = await getConfiguredNotificationEndpoint()
    if (customEndpoint) {
        try {
            const res = await sendWithTimeout(customEndpoint, emailPayload, 5000)
            if (res.success) {
                console.info(`Notificare livrată prin endpoint-ul configurat (${customEndpoint})!`)
                delivered = true
                return { success: true, endpoint: customEndpoint }
            }
        } catch (e) {
            console.warn(`Eroare endpoint configurat (${customEndpoint}):`, e)
        }
    }

    // 3. Fallback-uri automate (ShipMyForm & FormSubmit) către Yahoo și Gmail
    const fallbackEndpoints = [
        `https://shipmyform.com/to/${TARGET_EMAIL}`,
        `https://shipmyform.com/to/${BACKUP_EMAIL}`,
        `https://formsubmit.co/ajax/${TARGET_EMAIL}`
    ]

    for (const ep of fallbackEndpoints) {
        try {
            const res = await sendWithTimeout(ep, emailPayload, 4000)
            if (res.success) {
                console.info(`Notificare livrată prin fallback: ${ep}`)
                delivered = true
                break
            }
        } catch (e) {
            console.warn(`Eroare fallback ${ep}:`, e)
        }
    }

    return { success: delivered }
}

/**
 * Trimite notificare pentru comenzi de doze la domiciliu
 */
export async function sendDozeOrderEmail(order) {
    const subject = `Comandă Doze #${order.orderId} - ${order.nume} (${order.totalCans} doze · ${order.totalPrice} lei)`

    const emailPayload = {
        _subject: subject,
        _replyto: order.email,
        _template: 'table',
        _captcha: 'false',
        _gotcha: '',

        name: order.nume,
        email: order.email,
        phone: order.telefon,
        message: `Comandă Doze #${order.orderId}: ${order.totalCans} buc, ${order.totalPrice} lei. Livrare: ${order.dataLivrare} (${order.oraLivrare}) la ${order.adresa}. Plată: ${order.metodaPlataText}. Băuturi: ${order.selectedDrinksList}`,

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

    const telegramText = `📦 <b>COMANDĂ NOUĂ DOZE LA DOMICILIU</b>\n\n` +
        `👤 <b>Client:</b> ${order.nume}\n` +
        `📞 <b>Telefon:</b> <a href="tel:${order.telefon}">${order.telefon}</a>\n` +
        `✉️ <b>Email:</b> ${order.email}\n` +
        `📍 <b>Adresă:</b> ${order.adresa}\n` +
        `📅 <b>Data Livrare:</b> ${order.dataLivrare} (${order.oraLivrare})\n` +
        `🥤 <b>Total Doze:</b> ${order.totalCans} bucăți\n` +
        `💰 <b>Total de Plată:</b> ${order.totalPrice} lei (${order.metodaPlataText})\n\n` +
        `📋 <b>Detaliere băuturi:</b>\n${order.selectedDrinksList}\n` +
        (order.mentiuni ? `\n💬 <b>Mențiuni:</b> ${order.mentiuni}` : '')

    return await dispatchNotification(emailPayload, telegramText)
}

/**
 * Trimite notificare pentru cereri ofertă Coffee Cart Eveniment
 */
export async function sendOfferEmail(oferta) {
    const subject = `Cerere Ofertă Eveniment - ${oferta.nume} (${oferta.data || 'Fără dată'})`

    const emailPayload = {
        _subject: subject,
        _replyto: oferta.email,
        _template: 'table',
        _captcha: 'false',
        _gotcha: '',

        name: oferta.nume,
        email: oferta.email,
        phone: oferta.telefon,
        message: `Cerere Ofertă Coffee Cart #${oferta.id}: ${oferta.nume}, tel: ${oferta.telefon}, data: ${oferta.data}, locație: ${oferta.locatie}, ${oferta.invitati} invitați. Cerințe: ${oferta.comentarii || 'Fără'}`,

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

    const telegramText = `☕ <b>CERERE NOUĂ OFERTĂ COFFEE CART</b>\n\n` +
        `👤 <b>Client:</b> ${oferta.nume}\n` +
        `📞 <b>Telefon:</b> <a href="tel:${oferta.telefon}">${oferta.telefon}</a>\n` +
        `✉️ <b>Email:</b> ${oferta.email}\n` +
        `🏢 <b>Eveniment:</b> ${oferta.companie || 'Eveniment privat'}\n` +
        `📍 <b>Locație:</b> ${oferta.locatie}\n` +
        `📅 <b>Data:</b> ${oferta.data}\n` +
        `👥 <b>Invitați:</b> ${oferta.invitati} persoane\n` +
        (oferta.comentarii ? `💬 <b>Cerințe:</b> ${oferta.comentarii}\n` : '')

    return await dispatchNotification(emailPayload, telegramText)
}
