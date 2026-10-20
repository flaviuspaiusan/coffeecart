import { SupabaseService } from './supabase.js'
import { sendDozeOrderEmail } from './emailService.js'

export const CANS_CATALOG = [
    {
        id: 'pistachio_latte',
        name: 'Pistachio Strawberry Iced Latte',
        price: 25,
        shortDesc: 'Espresso de specialitate, piure artizanal de fistic, lapte și note proaspete de căpșuni.',
        volume: '360 ml',
        color: '#5b7a50',
        accentBg: 'rgba(91, 122, 80, 0.12)'
    },
    {
        id: 'tiramisu_latte',
        name: 'Tiramisu Iced Latte',
        price: 25,
        shortDesc: 'Espresso dublu, cremă mascarpone, aromă delicată de pișcot și pudră de cacao fină.',
        volume: '360 ml',
        color: '#8c593a',
        accentBg: 'rgba(140, 89, 58, 0.12)'
    },
    {
        id: 'pumpkin_spice_latte',
        name: 'Pumpkin Spice Latte',
        price: 22,
        shortDesc: 'Lapte catifelat infuzat cu piure de dovleac copt, scorțișoară, nucșoară și espresso.',
        volume: '380 ml',
        color: '#c26927',
        accentBg: 'rgba(194, 105, 39, 0.12)'
    },
    {
        id: 'ube_latte',
        name: 'Ube Latte',
        price: 25,
        shortDesc: 'Băutură semnătură cu ube catifelat, aromă dulceagă florală, vanilie și lapte fin.',
        volume: '380 ml',
        color: '#764ba2',
        accentBg: 'rgba(118, 75, 162, 0.12)'
    },
    {
        id: 'iced_coffee',
        name: 'Iced Coffee',
        price: 22,
        shortDesc: 'Cafea de specialitate extrasă proaspăt, lapte și gheață, perfect echilibrată.',
        volume: '360 ml',
        color: '#4b382a',
        accentBg: 'rgba(75, 56, 42, 0.12)'
    },
    {
        id: 'cold_brew_tonic',
        name: 'Cold Brew Tonic',
        price: 22,
        shortDesc: 'Cold brew macerat lent timp de 16 ore, apă tonică premium și efervescență revigorantă.',
        volume: '360 ml',
        color: '#346b53',
        accentBg: 'rgba(52, 107, 83, 0.12)'
    },
    {
        id: 'tropical_cold_brew',
        name: 'Tropical Cold Brew',
        price: 22,
        shortDesc: 'Cold brew artizanal infuzat cu note exotice de mango și fructul pasiunii.',
        volume: '360 ml',
        color: '#d47124',
        accentBg: 'rgba(212, 113, 36, 0.12)'
    }
]

export const MIN_ORDER_CANS = 20

// Stare comenzi doze: { [id]: quantity }
let cansCart = {}
CANS_CATALOG.forEach(c => { cansCart[c.id] = 0 })

export function initDozeSection() {
    renderCansGrid()
    updateTotals()
    setupDateLimits()
    setupPaymentOptions()
    setupFormSubmission()
}

function renderCansGrid() {
    const grid = document.getElementById('doze-grid')
    if (!grid) return

    grid.innerHTML = CANS_CATALOG.map(can => {
        const qty = cansCart[can.id] || 0
        return `
            <div class="can-card" id="can-card-${can.id}">
                <div class="can-icon-wrap" style="background: ${can.accentBg}; border-color: ${can.color}40;">
                    <!-- Elegant Can Silhouette Placeholder -->
                    <svg width="44" height="66" viewBox="0 0 44 66" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <rect x="6" y="8" width="32" height="52" rx="7" fill="${can.color}" fill-opacity="0.22" stroke="${can.color}" stroke-width="2.2"/>
                        <path d="M11 4C11 2.89543 11.8954 2 13 2H31C32.1046 2 33 2.89543 33 4V8H11V4Z" fill="${can.color}" fill-opacity="0.45" stroke="${can.color}" stroke-width="1.8"/>
                        <ellipse cx="22" cy="60" rx="15" ry="3" fill="${can.color}" fill-opacity="0.35"/>
                        <rect x="12" y="24" width="20" height="2" rx="1" fill="${can.color}"/>
                        <rect x="15" y="30" width="14" height="2" rx="1" fill="${can.color}" fill-opacity="0.7"/>
                        <text x="22" y="44" text-anchor="middle" font-family="'Inter', sans-serif" font-size="8" font-weight="700" fill="${can.color}">${can.volume}</text>
                    </svg>
                    <span class="can-badge" style="background: ${can.color}; color: white;">Gata Ambalată</span>
                </div>
                <div class="can-info">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.35rem;">
                        <h3 class="can-title">${can.name}</h3>
                        <span class="can-price">${can.price} lei</span>
                    </div>
                    <p class="can-desc">${can.shortDesc}</p>
                    
                    <div class="can-counter-row">
                        <div class="can-counter">
                            <button type="button" class="btn-qty" onclick="window.changeCanQty('${can.id}', -1)" aria-label="Scade doze ${can.name}">&#8722;</button>
                            <input type="number" id="qty-input-${can.id}" class="can-qty-input" min="0" max="200" value="${qty}" onchange="window.setCanQty('${can.id}', this.value)" aria-label="Număr doze ${can.name}">
                            <button type="button" class="btn-qty" onclick="window.changeCanQty('${can.id}', 1)" aria-label="Adaugă doze ${can.name}">&#43;</button>
                        </div>
                        <div class="can-quick-btns">
                            <button type="button" class="btn-quick" onclick="window.changeCanQty('${can.id}', 5)">+5</button>
                            <button type="button" class="btn-quick" onclick="window.changeCanQty('${can.id}', 10)">+10</button>
                        </div>
                    </div>
                    <div id="subtotal-${can.id}" class="can-subtotal" style="${qty > 0 ? '' : 'display: none;'}">
                        Subtotal: <strong>${qty * can.price} lei</strong> (${qty} doze)
                    </div>
                </div>
            </div>
        `
    }).join('')
}

window.changeCanQty = function(id, delta) {
    const current = cansCart[id] || 0
    const next = Math.max(0, current + delta)
    cansCart[id] = next
    
    const input = document.getElementById(`qty-input-${id}`)
    if (input) input.value = next

    updateCardVisual(id, next)
    updateTotals()
}

window.setCanQty = function(id, val) {
    let num = parseInt(val, 10)
    if (isNaN(num) || num < 0) num = 0
    cansCart[id] = num

    const input = document.getElementById(`qty-input-${id}`)
    if (input) input.value = num

    updateCardVisual(id, num)
    updateTotals()
}

function updateCardVisual(id, qty) {
    const card = document.getElementById(`can-card-${id}`)
    const subtotal = document.getElementById(`subtotal-${id}`)
    const can = CANS_CATALOG.find(c => c.id === id)
    const price = can ? can.price : 22

    if (card) {
        if (qty > 0) card.classList.add('has-qty')
        else card.classList.remove('has-qty')
    }
    if (subtotal) {
        if (qty > 0) {
            subtotal.style.display = 'block'
            subtotal.innerHTML = `Subtotal: <strong>${qty * price} lei</strong> (${qty} doze)`
        } else {
            subtotal.style.display = 'none'
        }
    }
}

function calculateTotalCans() {
    return Object.values(cansCart).reduce((a, b) => a + b, 0)
}

function calculateTotalPrice() {
    return CANS_CATALOG.reduce((sum, can) => {
        const qty = cansCart[can.id] || 0
        return sum + (qty * can.price)
    }, 0)
}

function updateTotals() {
    const totalCans = calculateTotalCans()
    const totalPrice = calculateTotalPrice()
    const remaining = Math.max(0, MIN_ORDER_CANS - totalCans)

    // Actualizare contoare în bara flotantă / de control
    const countDisplay = document.getElementById('doze-total-count')
    const priceDisplay = document.getElementById('doze-total-price')
    const barProgress = document.getElementById('doze-bar-progress')
    const statusText = document.getElementById('doze-status-text')
    const proceedBtn = document.getElementById('doze-btn-proceed')

    if (countDisplay) countDisplay.textContent = totalCans
    if (priceDisplay) priceDisplay.textContent = `${totalPrice} lei`

    if (barProgress) {
        const pct = Math.min(100, Math.round((totalCans / MIN_ORDER_CANS) * 100))
        barProgress.style.width = `${pct}%`
        barProgress.style.backgroundColor = totalCans >= MIN_ORDER_CANS ? 'var(--primary-green)' : '#c26927'
    }

    if (statusText) {
        if (totalCans === 0) {
            statusText.innerHTML = `Alege aromele dorite. <strong>Comandă minimă: 20 doze</strong> (mix liber de arome).`
            statusText.className = 'doze-status-msg'
        } else if (totalCans < MIN_ORDER_CANS) {
            statusText.innerHTML = `Ai ales <strong>${totalCans} doze</strong>. Mai adaugă cel puțin <strong>${remaining} doze</strong> pentru a debloca comanda.`
            statusText.className = 'doze-status-msg warning'
        } else {
            statusText.innerHTML = `🎉 <strong>Comandă minimă atinsă!</strong> (${totalCans} doze selectate). Poți finaliza comanda mai jos.`
            statusText.className = 'doze-status-msg success'
        }
    }

    if (proceedBtn) {
        if (totalCans >= MIN_ORDER_CANS) {
            proceedBtn.disabled = false
            proceedBtn.innerHTML = `Finalizează Comanda (${totalPrice} lei) &darr;`
            proceedBtn.classList.remove('disabled')
        } else {
            proceedBtn.disabled = true
            proceedBtn.innerHTML = `Alege minim 20 doze (încă ${remaining})`
            proceedBtn.classList.add('disabled')
        }
    }

    renderCheckoutSummary()
}

window.scrollToDozeCheckout = function() {
    const total = calculateTotalCans()
    if (total < MIN_ORDER_CANS) {
        alert(`Comanda minimă este de 20 de doze gata ambalate. În prezent ai selectat ${total} doze. Te rugăm să mai adaugi cel puțin ${MIN_ORDER_CANS - total} doze.`)
        return
    }

    const checkoutCard = document.getElementById('doze-checkout-section')
    if (checkoutCard) {
        checkoutCard.style.display = 'block'
        checkoutCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
}

function renderCheckoutSummary() {
    const summaryContainer = document.getElementById('doze-summary-items')
    const finalCountEl = document.getElementById('doze-summary-final-count')
    const finalPriceEl = document.getElementById('doze-summary-final-price')

    if (!summaryContainer) return

    const selected = CANS_CATALOG.filter(c => (cansCart[c.id] || 0) > 0)
    if (selected.length === 0) {
        summaryContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.95rem;">Nu ai selectat încă nicio doză.</p>'
        return
    }

    summaryContainer.innerHTML = selected.map(c => {
        const q = cansCart[c.id]
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px dashed var(--glass-border); font-size: 0.95rem;">
                <span style="font-weight: 600; color: var(--text-main);">${q}x ${c.name} (${c.price} lei/buc)</span>
                <span style="color: var(--primary-green); font-weight: 700;">${q * c.price} lei</span>
            </div>
        `
    }).join('')

    const totalCans = calculateTotalCans()
    const totalPrice = calculateTotalPrice()
    if (finalCountEl) finalCountEl.textContent = `${totalCans} doze`
    if (finalPriceEl) finalPriceEl.textContent = `${totalPrice} lei`
}

function setupDateLimits() {
    const dateInput = document.getElementById('doze-delivery-date')
    if (!dateInput) return

    // Minim 1 zi inainte (de mâine încolo)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yyyy = tomorrow.getFullYear()
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const dd = String(tomorrow.getDate()).padStart(2, '0')
    const minDateStr = `${yyyy}-${mm}-${dd}`

    dateInput.min = minDateStr
    dateInput.value = minDateStr // Selectează implicit ziua de mâine

    // Maxim 60 de zile în avans
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 60)
    const maxDateStr = maxDate.toISOString().slice(0, 10)
    dateInput.max = maxDateStr
}

function setupPaymentOptions() {
    const paymentRadios = document.querySelectorAll('input[name="doze-payment-method"]')
    const bankDetailsBox = document.getElementById('doze-bank-details-box')

    paymentRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (bankDetailsBox) {
                bankDetailsBox.style.display = radio.value === 'transfer_bancar' ? 'block' : 'none'
            }
        })
    })
}

function setupFormSubmission() {
    const form = document.getElementById('doze-order-form')
    if (!form) return

    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        const totalCans = calculateTotalCans()
        if (totalCans < MIN_ORDER_CANS) {
            alert(`Comanda minimă este de 20 de doze. În prezent ai doar ${totalCans} doze.`)
            return
        }

        const submitBtn = document.getElementById('doze-submit-btn')
        const originalText = submitBtn.innerHTML
        submitBtn.disabled = true
        submitBtn.innerHTML = 'Se înregistrează comanda...'

        const nume = document.getElementById('doze-customer-name')?.value.trim() || ''
        const telefon = document.getElementById('doze-customer-phone')?.value.trim() || ''
        const email = document.getElementById('doze-customer-email')?.value.trim() || ''
        const adresa = document.getElementById('doze-delivery-address')?.value.trim() || ''
        const dataLivrare = document.getElementById('doze-delivery-date')?.value || ''
        const oraLivrare = document.getElementById('doze-delivery-time')?.value || '11:00 - 14:00'
        const mentiuni = document.getElementById('doze-customer-notes')?.value.trim() || ''
        const plataEl = document.querySelector('input[name="doze-payment-method"]:checked')
        const metodaPlata = plataEl ? plataEl.value : 'cash'
        const metodaPlataText = metodaPlata === 'cash' ? 'Cash la livrare (Ramburs)' : 'Transfer bancar (OP)'

        const selectedDrinksList = CANS_CATALOG
            .filter(c => (cansCart[c.id] || 0) > 0)
            .map(c => `${cansCart[c.id]}x ${c.name} (${cansCart[c.id] * c.price} lei - ${c.price} lei/buc)`)
            .join('\n')

        const totalPrice = calculateTotalPrice()

        const detaliiComandaText = `--- COMANDĂ DOZE LIVRARE LA DOMICILIU ---
Total Doze: ${totalCans} buc
Total de plată: ${totalPrice} lei
Metodă Plată: ${metodaPlataText}
Data Livrării: ${dataLivrare}
Interval Orar: ${oraLivrare}

DETALIERE DOZE:
${selectedDrinksList}

ADRESĂ LIVRARE:
${adresa}

${mentiuni ? `MENȚIUNI CLIENT:\n${mentiuni}` : ''}`

        const record = {
            id: 'doze_' + Date.now(),
            nume: nume,
            email: email,
            telefon: telefon,
            companie: `Comandă Doze (${metodaPlataText})`,
            locatie: adresa,
            data: `${dataLivrare} (${oraLivrare})`,
            invitati: `${totalCans} doze (${totalPrice} lei)`,
            comentarii: detaliiComandaText,
            timestamp: new Date().toISOString()
        }

        try {
            await SupabaseService.createOffer(record)

            // Trimite notificare email automată către pressocoffeecart@yahoo.com
            sendDozeOrderEmail({
                orderId: record.id,
                nume,
                telefon,
                email,
                adresa,
                dataLivrare,
                oraLivrare,
                totalCans,
                totalPrice,
                metodaPlataText,
                metodaPlata,
                selectedDrinksList,
                mentiuni
            }).catch(err => console.warn('Email notification error:', err))

            // Salvează și local pentru referință
            localStorage.setItem('presso_last_doze_order', JSON.stringify({
                id: record.id,
                nume,
                totalCans,
                totalPrice,
                dataLivrare,
                oraLivrare,
                metodaPlataText
            }))

            showSuccessScreen({
                orderId: record.id,
                nume,
                telefon,
                adresa,
                dataLivrare,
                oraLivrare,
                totalCans,
                totalPrice,
                metodaPlataText,
                metodaPlata,
                selectedDrinksList
            })

            // Reset cart
            CANS_CATALOG.forEach(c => { cansCart[c.id] = 0 })
            renderCansGrid()
            updateTotals()
            form.reset()
            setupDateLimits()
        } catch (err) {
            console.error('Eroare salvare comandă doze:', err)
            alert('A apărut o eroare la salvarea comenzii. Te rugăm să ne contactezi la 0748 151 407 sau să încerci din nou.')
            submitBtn.disabled = false
            submitBtn.innerHTML = originalText
        }
    })
}

function showSuccessScreen(info) {
    const checkoutCard = document.getElementById('doze-checkout-section')
    const successBox = document.getElementById('doze-success-box')
    
    if (checkoutCard) checkoutCard.style.display = 'none'
    if (successBox) {
        successBox.style.display = 'block'
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' })

        const detailsEl = document.getElementById('doze-success-details')
        if (detailsEl) {
            detailsEl.innerHTML = `
                <div style="background: rgba(93, 122, 78, 0.07); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem; text-align: left; font-family: 'Inter', sans-serif;">
                    <p style="margin-bottom: 0.5rem;"><strong>ID Comandă:</strong> #${info.orderId}</p>
                    <p style="margin-bottom: 0.5rem;"><strong>Client:</strong> ${info.nume} (${info.telefon})</p>
                    <p style="margin-bottom: 0.5rem;"><strong>Adresă Livrare:</strong> ${info.adresa}</p>
                    <p style="margin-bottom: 0.5rem;"><strong>Dată & Oră:</strong> 🗓️ ${info.dataLivrare} în intervalul ⏰ ${info.oraLivrare}</p>
                    <p style="margin-bottom: 0.5rem;"><strong>Cantitate:</strong> 📦 ${info.totalCans} doze</p>
                    <p style="margin-bottom: 0.5rem;"><strong>Total de plată:</strong> <span style="font-size: 1.25rem; font-weight: 700; color: var(--primary-green);">${info.totalPrice} lei</span></p>
                    <p style="margin-bottom: 0.5rem;"><strong>Metodă Plată:</strong> ${info.metodaPlataText}</p>
                    ${info.metodaPlata === 'transfer_bancar' ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: #ffffff; border-radius: 8px; border: 1px solid var(--primary-green);">
                        <strong style="color: var(--primary-green); display: block; margin-bottom: 0.3rem;">Date pentru Transfer Bancar:</strong>
                        <p style="font-size: 0.9rem; margin: 0.2rem 0;">Beneficiar: <strong>Presso Coffee Cart</strong></p>
                        <p style="font-size: 0.9rem; margin: 0.2rem 0;">Cont (IBAN): <strong id="iban-placeholder">RO... (va fi confirmat telefonic / pe WhatsApp)</strong></p>
                        <p style="font-size: 0.9rem; margin: 0.2rem 0;">Detalii transfer: <strong>Doze ${info.nume} #${info.orderId}</strong></p>
                    </div>
                    ` : ''}
                </div>
            `
        }
    }
}

// Auto-inițializare când DOM-ul este gata
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDozeSection)
} else {
    initDozeSection()
}
