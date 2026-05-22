import { SupabaseService } from './supabase.js'
import { supabase } from './supabase.js'

let currentMenu = []
let activeEventId = null  // single source of truth — updated by loadSettings()

const defaultMenuItems = [
    { id: 'espresso', name: 'Espresso', desc: '20/40 ml', image: 'assets/espresso_image_1778599544907.png' },
    { id: 'presso', name: 'Presso', desc: 'Băutură semnătură', image: 'assets/espresso_image_1778599544907.png' },
    { id: 'cortado', name: 'Cortado', desc: '80 ml (1 shot espresso + crema lapte)', image: 'assets/cortado_image_1778599592329.png' },
    { id: 'americano', name: 'Americano', desc: '100 ml (1 shot espresso + apa fierbinte)', image: 'assets/americano_image_1778599576520.png' },
    { id: 'cappuccino', name: 'Cappuccino', desc: '180 ml (1 shot espresso + crema lapte)', image: 'assets/cappuccino_image_1778599606617.png' },
    { id: 'flat_white', name: 'Flat White', desc: '180 ml (2 shot-uri espresso + crema lapte)', image: 'assets/flat_white_image_1778599620528.png' },
    { id: 'latte_macchiato', name: 'Latte Macchiato', desc: '250 ml (1 shot espresso + crema lapte)', image: 'assets/latte_macchiato_image_1778599636109.png' },
    { id: 'iced_coffee', name: 'Iced Coffee', desc: '360 ml', image: 'assets/iced_coffee_image_1778599653110.png' },
    { id: 'pistachio_latte', name: 'Pistachio Strawberry Iced Latte', desc: '360 ml', image: 'assets/pistachio_latte_image_1778599667717.png' },
    { id: 'tiramisu_latte', name: 'Tiramisu Iced Latte', desc: '360 ml', image: 'assets/tiramisu_latte_image_1778599682616.png' },
    { id: 'cold_brew_tonic', name: 'Cold Brew Tonic', desc: '360 ml', image: 'assets/cold_brew_tonic_image_1778599699004.png' },
    { id: 'tropical_cold_brew', name: 'Tropical Cold Brew', desc: '360 ml', image: 'assets/tropical_cold_brew_image_1778599721744.png' }
]

const menuGrid = document.getElementById('menu-grid')
const modal = document.getElementById('checkout-modal')
const btnCancel = document.getElementById('btn-cancel')
const checkoutForm = document.getElementById('checkout-form')
const toastContainer = document.getElementById('toast-container')
const activeOrderBanner = document.getElementById('active-order-banner')

let dbPrices = {} // prices loaded from Supabase settings

async function init() {
    try {
        propagateScanParam()
        await loadMenu()
        await loadSettings()
        await loadPrices()
        renderActiveOrder()

        SupabaseService.subscribeToOrders(() => renderActiveOrder())
        SupabaseService.subscribeToMenu(() => loadMenu())
        SupabaseService.subscribeToSettings(async () => {
            await loadSettings()
            await loadPrices()
        })

        // Polling fallback every 3s — garanteaza sincronizarea chiar daca Realtime nu functioneaza
        setInterval(async () => {
            await loadSettings()
        }, 3000)
    } catch (err) {
        console.error('Initialization error:', err)
    }
}

function propagateScanParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const scan = urlParams.get('scan');
    if (scan) {
        document.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('tel') && !href.startsWith('#')) {
                const separator = href.includes('?') ? '&' : '?';
                link.setAttribute('href', href + separator + 'scan=' + scan);
            }
        });
    }
}

async function loadMenu() {
    try {
        currentMenu = await SupabaseService.getMenuItems()
        if (!currentMenu || currentMenu.length === 0) {
            currentMenu = defaultMenuItems
        }
        renderMenu()
    } catch (err) {
        console.error('Error loading menu:', err)
        currentMenu = defaultMenuItems
        renderMenu()
    }
}

async function loadSettings() {
    try {
        // Method 1: read from settings table
        let eventId = await SupabaseService.getSetting('presso_active_event_id')

        // Method 2 (fallback): query events table directly for an active event
        if (!eventId || eventId === '') {
            const { data: activeEvents } = await supabase
                .from('events')
                .select('id')
                .eq('status', 'active')
                .limit(1)
            eventId = (activeEvents && activeEvents.length > 0) ? activeEvents[0].id : null
        }

        activeEventId = (eventId && eventId !== '') ? eventId : null

        // Keep localStorage in sync (for order submission)
        if (activeEventId) {
            localStorage.setItem('presso_active_event_id', activeEventId)
        } else {
            localStorage.removeItem('presso_active_event_id')
        }

        renderMenu()
    } catch (err) {
        console.error('Error loading settings:', err)
    }
}

async function loadPrices() {
    try {
        const rawPrices = await SupabaseService.getSetting('presso_prices')
        if (rawPrices) {
            if (typeof rawPrices === 'string') {
                dbPrices = JSON.parse(rawPrices)
            } else if (typeof rawPrices === 'object') {
                dbPrices = rawPrices
            }
            console.log('[Presso] Prices loaded from DB:', dbPrices)
        } else {
            console.log('[Presso] No saved prices in DB, using defaults.')
        }
        renderMenu()
    } catch (err) {
        console.error('Error loading prices:', err)
    }
}

function renderMenu() {
    if (!menuGrid) return
    menuGrid.innerHTML = ''
    const items = [...currentMenu]
    const hasActiveEvent = !!activeEventId   // use module variable, not localStorage
    const hasScanAccess = window.location.search.includes('scan=presso2026')

    // Control the visibility of the unauthorized banner
    const unauthorizedBanner = document.getElementById('unauthorized-banner')
    if (unauthorizedBanner) {
        if (!hasScanAccess) {
            // Direct visitors - always show view-only scan message
            unauthorizedBanner.style.display = 'block'
            unauthorizedBanner.querySelector('p:first-child').innerHTML = 'Meniu în mod vizualizare 👁️'
            unauthorizedBanner.querySelector('p:last-child').innerHTML = 'Comenzile sunt deschise doar pentru invitații prezenți la eveniment. Scanează codul QR de pe barul Coffee Cart pentru a plasa o comandă!'
            unauthorizedBanner.style.borderColor = 'var(--primary-green)'
            unauthorizedBanner.style.background = 'rgba(93, 122, 78, 0.05)'
            unauthorizedBanner.querySelector('p:first-child').style.color = 'var(--primary-green)'
        } else if (!hasActiveEvent) {
            // QR visitors, but no active event running
            unauthorizedBanner.style.display = 'block'
            unauthorizedBanner.querySelector('p:first-child').innerHTML = 'Comenzi închise ☕'
            unauthorizedBanner.querySelector('p:last-child').innerHTML = 'Momentan nu se pot plasa comenzi. Ne vedem la următorul eveniment!'
            unauthorizedBanner.style.borderColor = '#e53e3e'
            unauthorizedBanner.style.background = 'rgba(229, 62, 62, 0.05)'
            unauthorizedBanner.querySelector('p:first-child').style.color = '#e53e3e'
        } else {
            // QR visitors AND active event -> can order!
            unauthorizedBanner.style.display = 'none'
        }
    }

    const canOrder = hasActiveEvent && hasScanAccess

    const getSortValue = (item) => {
        if (!item) return 99
        const nameLower = item.name ? item.name.toLowerCase() : ''
        const idLower = item.id ? item.id.toLowerCase() : ''
        
        if (idLower === 'espresso' || nameLower === 'espresso') return 1
        if (idLower === 'presso' || nameLower === 'presso') return 2
        if (idLower === 'cortado' || nameLower === 'cortado') return 3
        if (idLower === 'americano' || nameLower === 'americano') return 4
        if (idLower.includes('cappuccino') || nameLower.includes('cappuccino') || idLower.includes('cappucino') || nameLower.includes('cappucino')) return 5
        if (idLower.includes('flat') || nameLower.includes('flat')) return 6
        if (idLower.includes('latte_macchiato') || nameLower.includes('latte macchiato') || (nameLower.includes('latte') && !nameLower.includes('pistachio') && !nameLower.includes('tiramisu') && !idLower.includes('pistachio') && !idLower.includes('tiramisu'))) return 7
        if (idLower.includes('iced_coffee') || nameLower.includes('iced coffee') || idLower.includes('iced coffeee') || nameLower.includes('iced coffeee')) return 8
        if (idLower.includes('pistachio') || nameLower.includes('pistachio')) return 9
        if (idLower.includes('tiramisu') || nameLower.includes('tiramisu')) return 10
        if (idLower.includes('cold_brew_tonic') || nameLower.includes('cold brew tonic')) return 11
        if (idLower.includes('tropical') || nameLower.includes('tropical')) return 12
        return 99
    }

    items.sort((a, b) => getSortValue(a) - getSortValue(b))

    items.forEach(item => {
        const card = document.createElement('div')
        card.className = 'card'
        
        const imageClickAttr = canOrder ? `onclick="openModal('${item.id}')" style="cursor: pointer;"` : ''
        const priceText = getItemPrice(item)
        
        card.innerHTML = `
            <div class="card-image-container" ${imageClickAttr}>
                <img src="${item.image}" alt="${item.name}" class="card-image" ${item.id === 'pistachio_latte' ? 'style="object-position: center 85%;"' : ''}>
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.name}</h3>
                ${priceText ? `<p class="card-price">${priceText}</p>` : ''}
                <p class="card-desc">${item.desc}</p>
                ${canOrder ? `<button class="btn" onclick="openModal('${item.id}')">Comandă</button>` : ''}
            </div>
        `
        menuGrid.appendChild(card)
    })
}

function getItemPrice(item) {
    if (!item) return ''
    const id = item.id ? item.id.toLowerCase() : ''
    const name = item.name ? item.name.toLowerCase() : ''

    // Helper: look up in DB prices by item id
    const dbEntry = dbPrices[item.id]

    if (id === 'espresso' || name === 'espresso') {
        const s = dbEntry ? (dbEntry.single || '9') : '9'
        const d = dbEntry ? (dbEntry.double || '10') : '10'
        return `${s} lei (Single) · ${d} lei (Double)`
    }
    const p = (key) => dbPrices[key] ? dbPrices[key].price : null
    if (id === 'presso' || name === 'presso') return `${p('presso') || '13'} lei`
    if (id === 'cortado' || name === 'cortado') return `${p('cortado') || '11'} lei`
    if (id === 'americano' || name === 'americano') return `${p('americano') || '10'} lei`
    if (id.includes('cappuccino') || name.includes('cappuccino') || id.includes('cappucino') || name.includes('cappucino')) return `${p('cappuccino') || '13'} lei`
    if (id.includes('flat') || name.includes('flat')) return `${p('flat_white') || '14'} lei`
    // ⚠️ pistachio & tiramisu BEFORE latte and iced_coffee (names overlap!)
    if (id.includes('pistachio') || name.includes('pistachio')) return `${p('pistachio_latte') || '17'} lei`
    if (id.includes('tiramisu') || name.includes('tiramisu')) return `${p('tiramisu_latte') || '17'} lei`
    if (id.includes('cold_brew_tonic') || name.includes('cold brew tonic')) return `${p('cold_brew_tonic') || '16'} lei`
    if (id.includes('tropical') || name.includes('tropical')) return `${p('tropical_cold_brew') || '16'} lei`
    if (id.includes('iced_coffee') || name.includes('iced coffee') || id.includes('iced coffeee') || name.includes('iced coffeee')) return `${p('iced_coffee') || '15'} lei`
    if (id.includes('latte_macchiato') || name.includes('latte macchiato') || (name.includes('latte') && !name.includes('pistachio') && !name.includes('tiramisu') && !id.includes('pistachio') && !id.includes('tiramisu'))) return `${p('latte_macchiato') || '14'} lei`
    return ''
}

// Returns the numeric price for a given item + espresso type selection
function getItemPriceNumeric(item, espressoType) {
    if (!item) return null
    const id = item.id ? item.id.toLowerCase() : ''
    const name = item.name ? item.name.toLowerCase() : ''
    const dbEntry = dbPrices[item.id]
    const p = (key) => dbPrices[key] ? Number(dbPrices[key].price) : null

    if (id === 'espresso' || name === 'espresso') {
        if (espressoType === 'Double') {
            return dbEntry ? Number(dbEntry.double || 10) : 10
        }
        return dbEntry ? Number(dbEntry.single || 9) : 9
    }
    if (id === 'presso' || name === 'presso') return p('presso') || 13
    if (id === 'cortado' || name === 'cortado') return p('cortado') || 11
    if (id === 'americano' || name === 'americano') return p('americano') || 10
    if (id.includes('cappuccino') || name.includes('cappuccino') || id.includes('cappucino') || name.includes('cappucino')) return p('cappuccino') || 13
    if (id.includes('flat') || name.includes('flat')) return p('flat_white') || 14
    if (id.includes('pistachio') || name.includes('pistachio')) return p('pistachio_latte') || 17
    if (id.includes('tiramisu') || name.includes('tiramisu')) return p('tiramisu_latte') || 17
    if (id.includes('cold_brew_tonic') || name.includes('cold brew tonic')) return p('cold_brew_tonic') || 16
    if (id.includes('tropical') || name.includes('tropical')) return p('tropical_cold_brew') || 16
    if (id.includes('iced_coffee') || name.includes('iced coffee') || id.includes('iced coffeee') || name.includes('iced coffeee')) return p('iced_coffee') || 15
    if (id.includes('latte_macchiato') || name.includes('latte macchiato') || (name.includes('latte') && !name.includes('pistachio') && !name.includes('tiramisu') && !id.includes('pistachio') && !id.includes('tiramisu'))) return p('latte_macchiato') || 14
    return null
}

window.openRevolutModal = function(itemName, amount) {
    const overlay = document.getElementById('revolut-modal')
    if (!overlay) return
    document.getElementById('revolut-item-name').textContent = itemName
    document.getElementById('revolut-amount').textContent = amount
    document.getElementById('revolut-amount-hint').textContent = amount
    overlay.style.display = 'flex'
    // Trigger animation on next frame
    requestAnimationFrame(() => {
        overlay.style.opacity = '1'
        overlay.style.pointerEvents = 'auto'
    })
}

window.closeRevolutModal = function() {
    const overlay = document.getElementById('revolut-modal')
    if (!overlay) return
    overlay.style.opacity = '0'
    overlay.style.pointerEvents = 'none'
    setTimeout(() => { overlay.style.display = 'none' }, 300)
}

window.openModal = function(itemId) {
    const hasActiveEvent = !!activeEventId   // use module variable
    const hasScanAccess = window.location.search.includes('scan=presso2026')
    
    if (!hasScanAccess || !hasActiveEvent) {
        return // Block modal access for unauthorized/inactive states
    }

    const item = currentMenu.find(i => i.id === itemId)
    if (!item) return

    document.getElementById('modal-title').innerText = `Comandă ${item.name}`
    document.getElementById('modal-item-desc').innerText = item.desc
    document.getElementById('item-id').value = item.id
    const modalImg = document.getElementById('modal-image')
    if (modalImg) {
        modalImg.src = item.image
        modalImg.style.objectPosition = item.id === 'pistachio_latte' ? 'center 85%' : 'center'
    }

    const itemNameLower = item.name ? item.name.toLowerCase() : ''
    const isEspresso = (itemId === 'espresso' || itemNameLower === 'espresso')

    const espressoOptions = document.getElementById('espresso-options')
    if (espressoOptions) {
        espressoOptions.style.display = isEspresso ? 'block' : 'none'
    }

    // Show price in modal, dynamic for espresso
    const modalPrice = document.getElementById('modal-price')
    if (modalPrice) {
        const basePrice = getItemPrice(item)
        const espressoSingle = dbPrices['espresso'] ? (dbPrices['espresso'].single || '9') : '9'
        const espressoDouble = dbPrices['espresso'] ? (dbPrices['espresso'].double || '10') : '10'
        modalPrice.textContent = isEspresso ? `${espressoSingle} lei` : basePrice
        modalPrice.style.display = basePrice ? 'block' : 'none'

        if (isEspresso) {
            // Update price live when Single/Double changes
            document.querySelectorAll('input[name="espresso-type"]').forEach(radio => {
                radio.onchange = () => {
                    modalPrice.textContent = radio.value === 'Double' ? `${espressoDouble} lei` : `${espressoSingle} lei`
                }
            })
            // Reset to Single price
            const singleRadio = document.querySelector('input[name="espresso-type"][value="Single"]')
            if (singleRadio) singleRadio.checked = true
        }
    }

    const aromaKeywords = ['cappuccino', 'cappucino', 'latte', 'flat', 'iced coffee', 'iced coffeee', 'iced_coffee']
    const isAromaEligible = aromaKeywords.some(kw => itemNameLower.includes(kw) || itemId.toLowerCase().includes(kw))

    const aromaOptions = document.getElementById('aroma-options')
    if (aromaOptions) {
        aromaOptions.style.display = isAromaEligible ? 'block' : 'none'
        const aromaCheckbox = document.getElementById('aroma-caramel')
        if (aromaCheckbox) aromaCheckbox.checked = false
    }

    modal.classList.add('active')
    document.getElementById('customer-name').focus()

    const confirmBtn = document.getElementById('btn-confirm-order')
    if (confirmBtn) {
        confirmBtn.style.display = ''
    }
}

function closeModal() {
    modal.classList.remove('active')
    checkoutForm.reset()
}

function showToast(message) {
    const toast = document.createElement('div')
    toast.className = 'toast'
    toast.innerHTML = `<span>${message}</span>`
    toastContainer.appendChild(toast)

    setTimeout(() => {
        toast.style.opacity = '0'
        toast.style.transform = 'translateY(20px)'
        setTimeout(() => toast.remove(), 300)
    }, 3000)
}

checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const hasActiveEvent = !!activeEventId   // use module variable
    const hasScanAccess = window.location.search.includes('scan=presso2026')
    
    if (!hasScanAccess || !hasActiveEvent) {
        alert('Comenzile nu sunt disponibile pentru tine momentan.')
        return
    }

    const itemId = document.getElementById('item-id').value
    const item = currentMenu.find(i => i.id === itemId)
    const customerName = document.getElementById('customer-name').value

    let finalItemName = item.name
    if (itemId === 'espresso') {
        const typeEl = document.querySelector('input[name="espresso-type"]:checked')
        if (typeEl) finalItemName = `Espresso ${typeEl.value}`
    }

    const aromaCheckbox = document.getElementById('aroma-caramel')
    if (aromaCheckbox && aromaCheckbox.checked) finalItemName += ` + ${aromaCheckbox.value}`

    try {
        const currentActiveEventId = activeEventId  // use module variable
        const existingOrders = await SupabaseService.getOrders()
        
        // Filter orders belonging to the current event to calculate local order numbers starting from 1
        const eventOrders = existingOrders.filter(o => o.eventId === currentActiveEventId)
        const orderNumber = eventOrders.length > 0 ? Math.max(...eventOrders.map(o => o.orderNumber || 0)) + 1 : 1

        const order = {
            id: 'ord_' + Date.now(),
            orderNumber,
            itemName: finalItemName,
            customerName,
            timestamp: new Date().toISOString(),
            status: 'pending',
            eventId: currentActiveEventId || null
        }

        // Determine the numeric price for the payment modal
        const espressoTypeEl = document.querySelector('input[name="espresso-type"]:checked')
        const espressoType = espressoTypeEl ? espressoTypeEl.value : 'Single'
        const priceAmount = getItemPriceNumeric(item, espressoType)

        await SupabaseService.createOrder(order)
        localStorage.setItem('my_active_order_id', order.id)

        closeModal()
        showToast(`Comanda #${orderNumber} pentru ${item.name} a fost trimisă!`)
        renderActiveOrder()

        // Open Revolut payment modal
        if (priceAmount !== null) {
            openRevolutModal(finalItemName, priceAmount)
        }
    } catch (err) {
        console.error('Error submitting order:', err)
        alert('A apărut o eroare la trimiterea comenzii.')
    }
})

btnCancel.addEventListener('click', closeModal)

async function renderActiveOrder() {
    const hasScanAccess = window.location.search.includes('scan=presso2026')

    if (!hasScanAccess) {
        if (activeOrderBanner) activeOrderBanner.style.display = 'none'
        return
    }

    const activeOrderId = localStorage.getItem('my_active_order_id')
    if (!activeOrderId) {
        if (activeOrderBanner) activeOrderBanner.style.display = 'none'
        return
    }

    try {
        const existingOrders = await SupabaseService.getOrders()
        const myOrder = existingOrders.find(o => o.id === activeOrderId)

        if (!myOrder) {
            localStorage.removeItem('my_active_order_id')
            if (activeOrderBanner) activeOrderBanner.style.display = 'none'
            return
        }

        if (activeOrderBanner) activeOrderBanner.style.display = 'flex'

        if (myOrder.status === 'completed') {
            activeOrderBanner.className = 'active-order-banner ready'
            activeOrderBanner.innerHTML = `
                <div class="active-order-header">
                    <span class="active-order-title">Comanda #${myOrder.orderNumber} este Gata! 🎉</span>
                    <button class="btn btn-secondary" onclick="clearActiveOrder()" style="padding: 0.4rem 1rem; width: auto;">Închide</button>
                </div>
                <div class="active-order-details">Produs: <strong>${myOrder.itemName}</strong> | Nume: ${myOrder.customerName}</div>
                <div class="queue-count" style="color: #2e7d32; border: 1px solid rgba(46, 125, 50, 0.3);">Te rugăm să o ridici. O zi frumoasă!</div>
            `
        } else {
            const pendingOrders = existingOrders.filter(o => o.status === 'pending')
            pendingOrders.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            const myIndex = pendingOrders.findIndex(o => o.id === activeOrderId)
            const ordersAhead = myIndex >= 0 ? myIndex : 0

            activeOrderBanner.className = 'active-order-banner'
            activeOrderBanner.innerHTML = `
                <div class="active-order-header">
                    <span class="active-order-title">Comanda #${myOrder.orderNumber} (În preparare) ⏳</span>
                </div>
                <div class="active-order-details">Produs: <strong>${myOrder.itemName}</strong> | Nume: ${myOrder.customerName}</div>
                <div class="queue-count">
                    ${ordersAhead === 0 ? 'Comanda ta este următoarea!' : `Comenzi înaintea ta: <strong>${ordersAhead}</strong>`}
                </div>
            `
        }
    } catch (err) {
        console.error('Error rendering active order:', err)
    }
}

window.clearActiveOrder = function() {
    localStorage.removeItem('my_active_order_id')
    renderActiveOrder()
}

init()
