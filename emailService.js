const EMAIL_ENDPOINT = 'https://formsubmit.co/ajax/pressocoffeecart@yahoo.com'

/**
 * Trimite notificare email pentru comenzi de doze la domiciliu
 */
export async function sendDozeOrderEmail(order) {
    const payload = {
        _subject: `📦 Comandă Doze #${order.orderId} - ${order.nume} (${order.totalCans} doze · ${order.totalPrice} lei)`,
        _replyto: order.email,
        _template: 'table',
        _captcha: 'false',
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
            ? '💵 DE ÎNCASAT CASH LA LIVRARE (RAMBURS)' 
            : '🏦 TRANSFER BANCAR (Așteaptă OP / confirmare plată)',
        'Detaliere Doze': order.selectedDrinksList,
        'Mențiuni Speciale': order.mentiuni || 'Fără mențiuni speciale',
        'Data Înregistrării': new Date().toLocaleString('ro-RO')
    }

    try {
        const response = await fetch(EMAIL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        const result = await response.json()
        return result
    } catch (err) {
        console.warn('Eroare la trimiterea notificării email doze:', err)
        return { success: false, error: err }
    }
}

/**
 * Trimite notificare email pentru cereri ofertă Coffee Cart Eveniment
 */
export async function sendOfferEmail(oferta) {
    const payload = {
        _subject: `☕ Cerere Ofertă Eveniment - ${oferta.nume} (${oferta.data || 'Fără dată'})`,
        _replyto: oferta.email,
        _template: 'table',
        _captcha: 'false',
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

    try {
        const response = await fetch(EMAIL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        const result = await response.json()
        return result
    } catch (err) {
        console.warn('Eroare la trimiterea notificării email ofertă:', err)
        return { success: false, error: err }
    }
}
