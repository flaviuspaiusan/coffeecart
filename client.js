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
        const orderingStatus = await SupabaseService.getSetting('presso_ordering')
        localStorage.setItem('presso_ordering', orderingStatus || 'enabled')

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
    const orderingEnabled = localStorage.getItem('presso_ordering') !== 'disabled'

    const orderMap = { 'espresso': 1, 'presso': 2, 'cortado': 3, 'americano': 4, 'cappuccino': 5, 'cappucino': 5 }
    items.sort((a, b) => {
        const valA = orderMap[a.name?.toLowerCase()] || orderMap[a.id] || 99
        const valB = orderMap[b.name?.toLowerCase()] || orderMap[b.id] || 99
        return valA - valB
    })

    items.forEach(item => {
        const card = document.createElement('div')
        card.className = 'card'
        card.innerHTML = `
            <div class="card-image-container" onclick="openModal('${item.id}')" style="cursor: pointer;">
                <img src="${item.image}" alt="${item.name}" class="card-image" ${item.id === 'pistachio_latte' ? 'style="object-position: center 85%;"' : ''}>
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.name}</h3>
                <p class="card-desc">${item.desc}</p>
                ${orderingEnabled ? `<button class="btn" onclick="openModal('${item.id}')">Comandă</button>` : ''}
            </div>
        `
        menuGrid.appendChild(card)
    })
}

window.openModal = function(itemId) {
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
    if (espressoOptions) espressoOptions.style.display = itemId === 'espresso' ? 'block' : 'none'

    const aromaIds = ['cappuccino', 'flat_white', 'latte_macchiato', 'iced_coffee']
    const aromaOptions = document.getElementById('aroma-options')
    if (aromaOptions) {
        aromaOptions.style.display = aromaIds.includes(itemId) ? 'block' : 'none'
        const aromaCheckbox = document.getElementById('aroma-caramel')
        if (aromaCheckbox) aromaCheckbox.checked = false
    }

    modal.classList.add('active')
    document.getElementById('customer-name').focus()

    const confirmBtn = document.getElementById('btn-confirm-order')
    if (confirmBtn) {
        const orderingEnabled = localStorage.getItem('presso_ordering') !== 'disabled'
        confirmBtn.style.display = orderingEnabled ? '' : 'none'
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
