import { SupabaseService } from './supabase.js'

let currentMenu = []

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

async function init() {
    try {
        propagateScanParam()
        await loadMenu()
        await loadSettings()
        renderActiveOrder()

        SupabaseService.subscribeToOrders(() => renderActiveOrder())
        SupabaseService.subscribeToMenu(() => loadMenu())
        SupabaseService.subscribeToSettings(() => loadSettings())
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
        const activeEventId = await SupabaseService.getSetting('presso_active_event_id')
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

function renderMenu() {
    if (!menuGrid) return
    menuGrid.innerHTML = ''
    const items = [...currentMenu]
    const hasActiveEvent = !!localStorage.getItem('presso_active_event_id')
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
        
        card.innerHTML = `
            <div class="card-image-container" ${imageClickAttr}>
                <img src="${item.image}" alt="${item.name}" class="card-image" ${item.id === 'pistachio_latte' ? 'style="object-position: center 85%;"' : ''}>
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.name}</h3>
                <p class="card-desc">${item.desc}</p>
                ${canOrder ? `<button class="btn" onclick="openModal('${item.id}')">Comandă</button>` : ''}
            </div>
        `
        menuGrid.appendChild(card)
    })
}

window.openModal = function(itemId) {
    const hasActiveEvent = !!localStorage.getItem('presso_active_event_id')
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

    const espressoOptions = document.getElementById('espresso-options')
    const itemNameLower = item.name ? item.name.toLowerCase() : ''
    if (espressoOptions) {
        espressoOptions.style.display = (itemId === 'espresso' || itemNameLower === 'espresso') ? 'block' : 'none'
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

    const hasActiveEvent = !!localStorage.getItem('presso_active_event_id')
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
        const existingOrders = await SupabaseService.getOrders()
        const orderNumber = existingOrders.length > 0 ? Math.max(...existingOrders.map(o => o.orderNumber || 0)) + 1 : 1
        const activeEventId = localStorage.getItem('presso_active_event_id')

        const order = {
            id: 'ord_' + Date.now(),
            orderNumber,
            itemName: finalItemName,
            customerName,
            timestamp: new Date().toISOString(),
            status: 'pending',
            eventId: activeEventId || null
        }

        await SupabaseService.createOrder(order)
        localStorage.setItem('my_active_order_id', order.id)

        closeModal()
        showToast(`Comanda #${orderNumber} pentru ${item.name} a fost trimisă!`)
        renderActiveOrder()
    } catch (err) {
        console.error('Error submitting order:', err)
        alert('A apărut o eroare la trimiterea comenzii.')
    }
})

btnCancel.addEventListener('click', closeModal)

async function renderActiveOrder() {
    const hasActiveEvent = !!localStorage.getItem('presso_active_event_id')
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
