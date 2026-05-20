import { SupabaseService } from './supabase.js'

const ordersList = document.getElementById('orders-list')
const offersList = document.getElementById('offers-list')

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

let currentMenuAdmin = []
let activeEvent = null

async function initAdmin() {
    try {
        await loadOrders()
        await loadOffers()
        await loadMenu()
        await updateOrderingUI()
        await loadActiveEvent()

        SupabaseService.subscribeToOrders(() => loadOrders())
        SupabaseService.subscribeToMenu(() => loadMenu())
        SupabaseService.subscribeToSettings(() => {
            updateOrderingUI()
            loadActiveEvent()
        })
    } catch (err) {
        console.error('Admin initialization error:', err)
    }
}

// ── ORDERING TOGGLE ──
async function updateOrderingUI() {
    try {
        const status = await SupabaseService.getSetting('presso_ordering') || 'enabled'
        localStorage.setItem('presso_ordering', status)

        const enabled = status !== 'disabled'
        const btn = document.getElementById('ordering-toggle-btn')
        const txt = document.getElementById('ordering-status-text')
        if (!btn || !txt) return

        if (enabled) {
            btn.textContent = 'Dezactivează Comenzile'
            btn.style.background = '#e53e3e'
            btn.style.color = 'white'
            txt.textContent = 'Comenzi Active'
            txt.style.color = 'var(--primary-green)'
        } else {
            btn.textContent = 'Activează Comenzile'
            btn.style.background = 'var(--primary-green)'
            btn.style.color = 'white'
            txt.textContent = 'Comenzi Inactive'
            txt.style.color = '#e53e3e'
        }
    } catch (err) {
        console.error('Error updating ordering UI:', err)
    }
}

window.toggleOrdering = async function() {
    const current = localStorage.getItem('presso_ordering') || 'enabled'
    const next = current === 'disabled' ? 'enabled' : 'disabled'
    try {
        await SupabaseService.setSetting('presso_ordering', next)
        await updateOrderingUI()
    } catch (err) {
        console.error('Error toggling ordering:', err)
    }
}

// ── EVENT MANAGEMENT ──
async function loadActiveEvent() {
    try {
        const activeEventId = await SupabaseService.getSetting('presso_active_event_id')
        const noActiveView = document.getElementById('no-active-event-view')
        const activeView = document.getElementById('active-event-view')
        const nameDisplay = document.getElementById('active-event-name-display')

        if (activeEventId) {
            const events = await SupabaseService.getEvents()
            activeEvent = events.find(e => e.id === activeEventId)
            if (activeEvent) {
                nameDisplay.textContent = activeEvent.name
                noActiveView.style.display = 'none'
                activeView.style.display = 'flex'
                return
            }
        }

        activeEvent = null
        noActiveView.style.display = 'flex'
        activeView.style.display = 'none'
    } catch (err) {
        console.error('Error loading active event:', err)
    }
}

window.startNewEvent = async function() {
    const nameInput = document.getElementById('new-event-name')
    const name = nameInput.value.trim()
    if (!name) {
        alert('Te rugăm să introduci un nume pentru eveniment!')
        return
    }

    try {
        const eventId = 'evt_' + Date.now()
        const event = {
            id: eventId,
            name: name,
            timestamp: new Date().toISOString(),
            status: 'active'
        }

        await SupabaseService.createEvent(event)
        await SupabaseService.setSetting('presso_active_event_id', eventId)
        nameInput.value = ''
        await loadActiveEvent()
        alert(`Evenimentul "${name}" a pornit! Toate comenzile noi vor fi asociate cu acesta.`)
    } catch (err) {
        console.error('Error starting new event:', err)
        alert('Eroare la pornirea evenimentului.')
    }
}

window.stopActiveEvent = async function() {
    if (!activeEvent) return
    if (confirm(`Sigur vrei să încheie evenimentul "${activeEvent.name}"?`)) {
        try {
            await SupabaseService.updateEventStatus(activeEvent.id, 'completed')
            await SupabaseService.setSetting('presso_active_event_id', '')
            await loadActiveEvent()
            alert('Eveniment încheiat cu succes!')
        } catch (err) {
            console.error('Error stopping event:', err)
            alert('Eroare la finalizarea evenimentului.')
        }
    }
}

async function loadEvents() {
    try {
        const events = await SupabaseService.getEvents()
        renderEvents(events)
    } catch (err) {
        console.error('Error loading events:', err)
    }
}

function renderEvents(events) {
    const list = document.getElementById('events-list')
    if (!list) return
    list.innerHTML = ''

    if (events.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Nu există evenimente înregistrate.</p>'
        return
    }

    events.forEach(evt => {
        const date = new Date(evt.timestamp)
        const dateStr = date.toLocaleDateString('ro-RO') + ' ' + date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
        const isActive = evt.status === 'active'

        const item = document.createElement('div')
        item.className = 'order-item'
        if (isActive) item.style.borderLeftColor = 'var(--primary-green)'

        item.innerHTML = `
            <div class="order-info" style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h3>${evt.name} ${isActive ? '<span class="badge" style="background: rgba(46, 125, 50, 0.1); color: var(--primary-green);">Activ</span>' : '<span class="badge" style="background: rgba(120, 120, 120, 0.1); color: #787878;">Finalizat</span>'}</h3>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn" onclick="viewEventOrders('${evt.id}', '${evt.name.replace(/'/g, "\\'")}')" style="width: auto; padding: 0.4rem 1rem; font-size: 0.9rem;">Vezi Comenzi</button>
                        ${!isActive ? `<button class="btn btn-secondary" onclick="deleteEvent('${evt.id}')" style="width: auto; padding: 0.4rem 1rem; font-size: 0.9rem; background: #e53e3e; color: white;">Șterge</button>` : ''}
                    </div>
                </div>
                <div class="order-meta">Creat la: ${dateStr}</div>
            </div>
        `
        list.appendChild(item)
    })
}

window.deleteEvent = async function(eventId) {
    if (confirm('Sigur vrei să ștergi acest eveniment? Această acțiune va șterge doar evenimentul din istoric, dar comenzile lui vor rămâne salvate în baza de date.')) {
        try {
            await SupabaseService.deleteEvent(eventId)
            await loadEvents()
        } catch (err) {
            console.error('Error deleting event:', err)
            alert('Eroare la ștergerea evenimentului.')
        }
    }
}

window.clearCompletedEvents = async function() {
    if (confirm('Sigur vrei să ștergi TOATE evenimentele finalizate? Această acțiune va șterge doar evenimentele din istoric, dar toate comenzile lor vor rămâne salvate în baza de date.')) {
        try {
            await SupabaseService.clearCompletedEvents()
            await loadEvents()
        } catch (err) {
            console.error('Error clearing completed events:', err)
            alert('Eroare la ștergerea tuturor evenimentelor.')
        }
    }
}

window.viewEventOrders = async function(eventId, eventName) {
    try {
        const orders = await SupabaseService.getOrdersByEvent(eventId)
        const list = document.getElementById('event-orders-list')
        const title = document.getElementById('event-details-title')

        title.textContent = `Comenzi - ${eventName}`
        list.innerHTML = ''

        if (orders.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Nu s-a înregistrat nicio comandă în acest eveniment.</p>'
        } else {
            orders.forEach(order => {
                const date = new Date(order.timestamp)
                const timeStr = date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })

                let servedTimeStr = ''
                const servedAtVal = order.servedAt || order.servedat
                if (servedAtVal) {
                    const servedDate = new Date(servedAtVal)
                    servedTimeStr = servedDate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
                }

                const div = document.createElement('div')
                div.className = 'order-item completed'
                div.innerHTML = `
                    <div class="order-info">
                        <h3>#${order.orderNumber || ''} ${order.itemName}</h3>
                        <p><strong>Client:</strong> ${order.customerName}</p>
                        <div class="order-meta">
                            Plasată la: ${timeStr} 
                            ${servedTimeStr ? `| Servită la: ${servedTimeStr}` : ''}
                            | Status: ${order.status === 'completed' ? 'Servită' : 'În preparare'}
                        </div>
                    </div>
                `
                list.appendChild(div)
            })
        }

        document.getElementById('event-details-modal').classList.add('active')
    } catch (err) {
        console.error('Error fetching event orders:', err)
        alert('Eroare la preluarea comenzilor evenimentului.')
    }
}

window.closeEventDetailsModal = function() {
    document.getElementById('event-details-modal').classList.remove('active')
}

// ── ORDERS LIST ──
async function loadOrders() {
    try {
        const orders = await SupabaseService.getOrders()
        // Default orders list shows only active event orders or unassociated orders
        // Filter orders based on active event to make active queue clean
        const activeEventId = await SupabaseService.getSetting('presso_active_event_id')
        
        const filteredOrders = orders.filter(o => {
            if (activeEventId) {
                return o.eventId === activeEventId
            }
            return !o.eventId // If no active event, show orders that don't belong to any event
        })

        filteredOrders.sort((a, b) => {
            if (a.status !== b.status) {
                return a.status === 'pending' ? -1 : 1
            }
            if (a.status === 'pending') {
                // For pending orders: oldest first (ascending order) so they don't get missed/delayed
                return new Date(a.timestamp) - new Date(b.timestamp)
            } else {
                // For completed orders: newest first (descending order) by served time
                const timeA = a.servedAt || a.servedat || a.timestamp
                const timeB = b.servedAt || b.servedat || b.timestamp
                return new Date(timeB) - new Date(timeA)
            }
        })
        renderOrders(filteredOrders)
    } catch (err) {
        console.error('Error loading orders:', err)
    }
}

function renderOrders(orders) {
    if (!ordersList) return
    ordersList.innerHTML = ''

    if (orders.length === 0) {
        ordersList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Nu există comenzi active momentan.</p>'
        return
    }

    orders.forEach(order => {
        const date = new Date(order.timestamp)
        const timeStr = date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
        const isCompleted = order.status === 'completed'
        const displayOrderNum = order.orderNumber ? `#${order.orderNumber} ` : ''

        let servedTimeStr = ''
        const servedAtVal = order.servedAt || order.servedat
        if (isCompleted && servedAtVal) {
            const servedDate = new Date(servedAtVal)
            servedTimeStr = servedDate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
        }

        const item = document.createElement('div')
        item.className = `order-item ${isCompleted ? 'completed' : ''}`
        item.innerHTML = `
            <div class="order-info">
                <h3>${displayOrderNum}${order.itemName} <span class="badge ${isCompleted ? 'completed' : ''}">${isCompleted ? 'Finalizată' : 'În preparare'}</span></h3>
                <p><strong>Client:</strong> ${order.customerName}</p>
                <div class="order-meta">
                    Plasată la: ${timeStr} 
                    ${isCompleted && servedTimeStr ? `| Servită la: ${servedTimeStr}` : ''}
                </div>
            </div>
            <div>
                ${!isCompleted ? `<button class="btn" onclick="markCompleted('${order.id}')" style="width: auto;">Gata de Servire</button>` : ''}
            </div>
        `
        ordersList.appendChild(item)
    })
}

window.markCompleted = async function(orderId) {
    try {
        await SupabaseService.updateOrderStatus(orderId, 'completed')
        await loadOrders()
    } catch (err) {
        console.error('Error marking completed:', err)
    }
}

window.clearOrders = async function() {
    try {
        const activeEventId = await SupabaseService.getSetting('presso_active_event_id')
        const confirmMsg = activeEventId 
            ? 'Ești sigur că vrei să ștergi comenzile din acest eveniment activ? Istoricul evenimentelor finalizate va fi păstrat.' 
            : 'Ești sigur că vrei să ștergi toate comenzile din afara evenimentelor?';
            
        if (confirm(confirmMsg)) {
            await SupabaseService.clearOrders(activeEventId)
            await loadOrders()
        }
    } catch (err) {
        console.error('Error clearing orders:', err)
    }
}

// --- Menu Management ---
async function loadMenu() {
    try {
        currentMenuAdmin = await SupabaseService.getMenuItems()
        if (!currentMenuAdmin || currentMenuAdmin.length === 0) currentMenuAdmin = defaultMenuItems

        const list = document.getElementById('admin-menu-list')
        if (!list) return
        list.innerHTML = ''

        const orderMap = { 'espresso': 1, 'presso': 2, 'cortado': 3, 'americano': 4, 'cappuccino': 5 }
        currentMenuAdmin.sort((a, b) => {
            const valA = orderMap[a.name?.toLowerCase()] || orderMap[a.id] || 99
            const valB = orderMap[b.name?.toLowerCase()] || orderMap[b.id] || 99
            return valA - valB
        })

        currentMenuAdmin.forEach(item => {
            const card = document.createElement('div')
            card.className = 'card'
            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${item.image}" class="card-image">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${item.name}</h3>
                    <p class="card-desc">${item.desc}</p>
                    <div style="display: flex; gap: 0.5rem; margin-top: auto;">
                        <button class="btn" onclick="editMenuItem('${item.id}')" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">Editează</button>
                        <button class="btn btn-secondary" onclick="deleteMenuItem('${item.id}')" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">Șterge</button>
                    </div>
                </div>
            `
            list.appendChild(card)
        })
    } catch (err) {
        console.error('Error loading menu:', err)
    }
}

window.switchTab = function(tabId) {
    document.getElementById('section-orders').style.display = tabId === 'orders' ? 'block' : 'none'
    document.getElementById('section-menu').style.display = tabId === 'menu' ? 'block' : 'none'
    document.getElementById('section-offers').style.display = tabId === 'offers' ? 'block' : 'none'
    document.getElementById('section-events').style.display = tabId === 'events' ? 'block' : 'none'

    document.getElementById('tab-orders').className = tabId === 'orders' ? 'btn' : 'btn btn-secondary'
    document.getElementById('tab-menu').className = tabId === 'menu' ? 'btn' : 'btn btn-secondary'
    document.getElementById('tab-offers').className = tabId === 'offers' ? 'btn' : 'btn btn-secondary'
    document.getElementById('tab-events').className = tabId === 'events' ? 'btn' : 'btn btn-secondary'

    if (tabId === 'menu') loadMenu()
    else if (tabId === 'offers') loadOffers()
    else if (tabId === 'orders') loadOrders()
    else if (tabId === 'events') loadEvents()
}

window.openMenuModal = function() {
    document.getElementById('menu-modal-title').innerText = 'Adaugă Produs Nou'
    document.getElementById('menu-form').reset()
    document.getElementById('menu-item-id').value = ''
    document.getElementById('menu-image-data').value = ''
    document.getElementById('image-preview-container').style.display = 'none'
    document.getElementById('menu-modal').classList.add('active')
}

window.closeMenuModal = function() {
    document.getElementById('menu-modal').classList.remove('active')
}

window.editMenuItem = function(id) {
    const item = currentMenuAdmin.find(i => i.id === id)
    if (!item) return

    document.getElementById('menu-modal-title').innerText = 'Editează Produs'
    document.getElementById('menu-item-id').value = item.id
    document.getElementById('menu-name').value = item.name
    document.getElementById('menu-desc').value = item.desc
    document.getElementById('menu-image-data').value = item.image

    const preview = document.getElementById('image-preview')
    preview.src = item.image
    document.getElementById('image-preview-container').style.display = 'block'
    document.getElementById('menu-modal').classList.add('active')
}

window.deleteMenuItem = async function(id) {
    if (confirm('Ești sigur că vrei să ștergi acest produs?')) {
        try {
            await SupabaseService.deleteMenuItem(id)
            await loadMenu()
        } catch (err) {
            console.error('Error deleting menu item:', err)
        }
    }
}

document.getElementById('menu-image').addEventListener('change', function(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = function(event) {
        const img = new Image()
        img.onload = function() {
            const canvas = document.createElement('canvas')
            const MAX = 800
            let w = img.width, h = img.height
            if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX } }
            else { if (h > MAX) { w *= MAX / h; h = MAX } }
            canvas.width = w; canvas.height = h
            canvas.getContext('2d').drawImage(img, 0, 0, w, h)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
            document.getElementById('menu-image-data').value = dataUrl
            document.getElementById('image-preview').src = dataUrl
            document.getElementById('image-preview-container').style.display = 'block'
        }
        img.src = event.target.result
    }
    reader.readAsDataURL(file)
})

document.getElementById('menu-form').addEventListener('submit', async function(e) {
    e.preventDefault()
    const id = document.getElementById('menu-item-id').value || 'item_' + Date.now()
    const name = document.getElementById('menu-name').value
    const desc = document.getElementById('menu-desc').value
    const image = document.getElementById('menu-image-data').value

    if (!image) { alert('Te rugăm să alegi o imagine!'); return }

    try {
        await SupabaseService.saveMenuItem({ id, name, desc, image })
        window.closeMenuModal()
        await loadMenu()
    } catch (err) {
        console.error('Eroare la salvare:', err)
        alert('Eroare la salvare. Poza este prea mare sau există o problemă de conexiune.')
    }
})

// --- Offers Management ---
async function loadOffers() {
    try {
        const offers = await SupabaseService.getOffers()
        renderOffers(offers)
    } catch (err) {
        console.error('Error loading offers:', err)
    }
}

function renderOffers(offers) {
    if (!offersList) return
    offersList.innerHTML = ''

    if (offers.length === 0) {
        offersList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Nu există cereri de ofertă momentan.</p>'
        return
    }

    offers.forEach(oferta => {
        const date = new Date(oferta.timestamp)
        const dateStr = date.toLocaleDateString('ro-RO') + ' ' + date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })

        const item = document.createElement('div')
        item.className = 'order-item'
        item.style.borderLeftColor = '#eab308'
        item.innerHTML = `
            <div class="order-info" style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <h3>Cerere de la ${oferta.nume} <span class="badge" style="background: rgba(234, 179, 8, 0.1); color: #eab308;">Ofertă Nouă</span></h3>
                    <button class="btn btn-secondary" onclick="deleteOffer('${oferta.id}')" style="padding: 0.3rem 0.8rem; font-size: 0.85rem;">Marcată ca Citită</button>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.75rem 2rem;">
                    <p><strong>Email:</strong> <a href="mailto:${oferta.email}" style="color: var(--primary-brown); text-decoration: none;">${oferta.email}</a></p>
                    <p><strong>Telefon:</strong> <a href="tel:${oferta.telefon}" style="color: var(--primary-brown); text-decoration: none;">${oferta.telefon}</a></p>
                    ${oferta.companie ? `<p><strong>Companie:</strong> ${oferta.companie}</p>` : ''}
                    <p><strong>Locație:</strong> ${oferta.locatie}</p>
                    <p><strong>Data Eveniment:</strong> ${oferta.data}</p>
                    <p><strong>Nr. Invitați:</strong> ${oferta.invitati} pers.</p>
                </div>
                ${oferta.comentarii ? `<div style="margin-top: 1rem; padding: 0.8rem; background: rgba(93,64,55,0.03); border-radius: 8px; border: 1px solid var(--glass-border); border-radius: 12px;"><strong>Comentarii:</strong><br><span style="white-space: pre-wrap;">${oferta.comentarii}</span></div>` : ''}
                <div class="order-meta" style="margin-top: 1rem; border-top: 1px solid var(--glass-border); padding-top: 0.5rem;">Trimisă la: ${dateStr}</div>
            </div>
        `
        offersList.appendChild(item)
    })
}

window.deleteOffer = async function(id) {
    if (confirm('Marchezi această cerere ca rezolvată? Ea va fi ștearsă din listă.')) {
        try {
            await SupabaseService.deleteOffer(id)
            await loadOffers()
        } catch (err) {
            console.error('Error deleting offer:', err)
        }
    }
}

window.clearOffers = async function() {
    if (confirm('Ești sigur că vrei să ștergi toate cererile de ofertă?')) {
        try {
            await SupabaseService.clearOffers()
            await loadOffers()
        } catch (err) {
            console.error('Error clearing offers:', err)
        }
    }
}

initAdmin()
