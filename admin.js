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
let outOfStockIds = []  // ID-urile produselor indisponibile

async function initAdmin() {
    try {
        await loadOrders()
        await loadOffers()
        await loadMenu()
        await loadActiveEvent()

        SupabaseService.subscribeToOrders(() => loadOrders())
        SupabaseService.subscribeToMenu(() => loadMenu())
        SupabaseService.subscribeToSettings(() => {
            loadActiveEvent()
        })
    } catch (err) {
        console.error('Admin initialization error:', err)
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

        const summaryContainer = document.getElementById('event-orders-summary')
        if (summaryContainer) {
            if (orders.length === 0) {
                summaryContainer.style.display = 'none'
            } else {
                summaryContainer.style.display = 'block'
                
                let totalOrders = orders.length
                let totalCups = 0
                const drinksMap = {}
                
                orders.forEach(order => {
                    const itemName = order.itemName || ""
                    const match = itemName.match(/^(\d+)x\s+(.+)$/i)
                    let quantity = 1
                    let baseName = itemName
                    if (match) {
                        quantity = parseInt(match[1], 10)
                        baseName = match[2]
                    }
                    totalCups += quantity
                    drinksMap[baseName] = (drinksMap[baseName] || 0) + quantity
                })
                
                const drinksList = Object.entries(drinksMap).map(([name, count]) => ({ name, count }))
                drinksList.sort((a, b) => b.count - a.count)
                
                let drinksHtml = ''
                drinksList.forEach(drink => {
                    const percentage = totalCups > 0 ? Math.round((drink.count / totalCups) * 100) : 0
                    drinksHtml += `
                        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem;">
                                <span style="font-weight: 600; color: var(--text-main);">${drink.name}</span>
                                <span style="font-weight: 700; color: var(--primary-green);">${drink.count} ${drink.count === 1 ? 'pahar' : 'pahare'}</span>
                            </div>
                            <div style="width: 100%; height: 8px; background: var(--bg-color); border-radius: 4px; overflow: hidden; border: 1px solid var(--glass-border);">
                                <div style="width: ${percentage}%; height: 100%; background: var(--primary-green); border-radius: 4px;"></div>
                            </div>
                        </div>
                    `
                })
                
                summaryContainer.innerHTML = `
                    <h3 style="font-family: 'Inter', sans-serif; font-size: 1.15rem; color: var(--primary-green); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">📊 Sumar Preferințe Comenzi</h3>
                    
                    <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 120px; background: rgba(93, 122, 78, 0.05); border: 1px solid var(--glass-border); padding: 0.75rem; border-radius: 8px; text-align: center;">
                            <p style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.25rem; font-family: 'Inter', sans-serif;">Total Comenzi</p>
                            <strong style="font-size: 1.5rem; color: var(--primary-green); font-family: 'Inter', sans-serif;">${totalOrders}</strong>
                        </div>
                        <div style="flex: 1; min-width: 120px; background: rgba(93, 122, 78, 0.05); border: 1px solid var(--glass-border); padding: 0.75rem; border-radius: 8px; text-align: center;">
                            <p style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.25rem; font-family: 'Inter', sans-serif;">Total Pahare</p>
                            <strong style="font-size: 1.5rem; color: var(--primary-green); font-family: 'Inter', sans-serif;">${totalCups}</strong>
                        </div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 0.75rem; font-family: 'Inter', sans-serif;">
                        ${drinksHtml}
                    </div>
                `
            }
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
        const isPaid = order.paid === true
        const displayOrderNum = order.orderNumber ? `#${order.orderNumber} ` : ''

        let servedTimeStr = ''
        const servedAtVal = order.servedAt || order.servedat
        if (isCompleted && servedAtVal) {
            const servedDate = new Date(servedAtVal)
            servedTimeStr = servedDate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
        }

        const paidBadge = isPaid
            ? `<span style="
                display: inline-flex; align-items: center; gap: 0.3rem;
                background: rgba(46,125,50,0.12); color: #2e7d32;
                border: 1px solid rgba(46,125,50,0.3);
                border-radius: 20px; padding: 0.2rem 0.7rem;
                font-size: 0.78rem; font-weight: 700; font-family: 'Inter', sans-serif;
              ">&#10003; Achitat</span>`
            : `<span style="
                display: inline-flex; align-items: center; gap: 0.3rem;
                background: rgba(229,62,62,0.10); color: #c53030;
                border: 1px solid rgba(229,62,62,0.3);
                border-radius: 20px; padding: 0.2rem 0.7rem;
                font-size: 0.78rem; font-weight: 700; font-family: 'Inter', sans-serif;
              ">&#10007; Neachitat</span>`

        const item = document.createElement('div')
        item.className = `order-item ${isCompleted ? 'completed' : ''}`
        item.innerHTML = `
            <div class="order-info">
                <h3>${displayOrderNum}${order.itemName} <span class="badge ${isCompleted ? 'completed' : ''}">${isCompleted ? 'Finalizată' : 'În preparare'}</span></h3>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin: 0.3rem 0;">
                    <strong style="font-family: 'Inter', sans-serif; font-size: 0.9rem;">Client:</strong>
                    <span>${order.customerName}</span>
                    ${paidBadge}
                </div>
                <div class="order-meta">
                    Plasată la: ${timeStr} 
                    ${isCompleted && servedTimeStr ? `| Servită la: ${servedTimeStr}` : ''}
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-end;">
                ${!isCompleted ? `<button class="btn" onclick="markCompleted('${order.id}')" style="width: auto;">Gata de Servire</button>` : ''}
                ${!isPaid ? `<button onclick="markPaid('${order.id}')" style="
                    width: auto; padding: 0.4rem 0.9rem;
                    background: rgba(46,125,50,0.1); color: #2e7d32;
                    border: 1px solid rgba(46,125,50,0.4);
                    border-radius: 8px; cursor: pointer;
                    font-family: 'Inter', sans-serif; font-size: 0.82rem; font-weight: 700;
                    transition: background 0.2s;
                " onmouseover="this.style.background='rgba(46,125,50,0.2)'" onmouseout="this.style.background='rgba(46,125,50,0.1)'">Marchează achitat</button>` : ''}
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

window.markPaid = async function(orderId) {
    try {
        await SupabaseService.updateOrderPaid(orderId, true)
        await loadOrders()
    } catch (err) {
        console.error('Error marking paid:', err)
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
        let items = await SupabaseService.getMenuItems()
        if (!items || items.length === 0) {
            items = defaultMenuItems
        } else {
            // Asigură-te că Tiramisu apare chiar dacă a fost șters din DB
            if (!items.some(i => i.id === 'tiramisu_latte' || (i.name && i.name.toLowerCase().includes('tiramisu')))) {
                const t = defaultMenuItems.find(i => i.id === 'tiramisu_latte')
                if (t) items.push(t)
            }
        }
        
        currentMenuAdmin = items
        // Incarca lista out of stock din Supabase
        try {
            const raw = await SupabaseService.getSetting('presso_out_of_stock')
            if (raw) {
                outOfStockIds = typeof raw === 'string' ? JSON.parse(raw) : raw
            } else {
                outOfStockIds = []
            }
        } catch(e) {
            outOfStockIds = []
        }

        const list = document.getElementById('admin-menu-list')
        if (!list) return
        list.innerHTML = ''

        const getSortValue = (item) => {
            if (!item) return 99
            const nameLower = item.name ? item.name.toLowerCase() : ''
            const idLower = item.id ? item.id.toLowerCase() : ''
            
            if (idLower === 'iced_coffee' || nameLower === 'iced coffee' || nameLower === 'iced coffeee') return 0
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

        currentMenuAdmin.sort((a, b) => getSortValue(a) - getSortValue(b))

        currentMenuAdmin.forEach(item => {
            const isOOS = outOfStockIds.includes(item.id)
            const card = document.createElement('div')
            card.className = 'card'
            card.style.opacity = isOOS ? '0.55' : '1'
            card.style.position = 'relative'
            card.innerHTML = `
                ${isOOS ? `<div style="
                    position: absolute; top: 10px; left: 10px; z-index: 2;
                    background: #c53030; color: white;
                    font-family: 'Inter', sans-serif; font-size: 0.72rem; font-weight: 800;
                    padding: 0.25rem 0.65rem; border-radius: 20px;
                    letter-spacing: 0.05em; text-transform: uppercase;
                ">Out of Stock</div>` : ''}
                <div class="card-image-container">
                    <img src="${item.image}" class="card-image">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${item.name}</h3>
                    <p class="card-desc">${item.desc}</p>
                    <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-top: auto;">
                        <button onclick="toggleOutOfStock('${item.id}')" style="
                            width: 100%; padding: 0.5rem; font-size: 0.88rem;
                            font-family: 'Inter', sans-serif; font-weight: 700;
                            border-radius: 8px; border: none; cursor: pointer;
                            transition: background 0.2s;
                            background: ${isOOS ? 'rgba(46,125,50,0.12)' : 'rgba(197,48,48,0.10)'};
                            color: ${isOOS ? '#2e7d32' : '#c53030'};
                            border: 1px solid ${isOOS ? 'rgba(46,125,50,0.3)' : 'rgba(197,48,48,0.3)'};
                        ">${isOOS ? '✓ Adaugă înapoi' : '⦻ Out of Stock'}</button>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn" onclick="editMenuItem('${item.id}')" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">Editează</button>
                            <button class="btn btn-secondary" onclick="deleteMenuItem('${item.id}')" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">Șterge</button>
                        </div>
                    </div>
                </div>
            `
            list.appendChild(card)
        })
    } catch (err) {
        console.error('Error loading menu:', err)
    }
}

window.toggleOutOfStock = async function(itemId) {
    if (outOfStockIds.includes(itemId)) {
        outOfStockIds = outOfStockIds.filter(id => id !== itemId)
    } else {
        outOfStockIds.push(itemId)
    }
    try {
        await SupabaseService.setSetting('presso_out_of_stock', JSON.stringify(outOfStockIds))
    } catch(e) {
        console.error('Error saving out of stock list:', e)
    }
    await loadMenu()  // Re-render cu starea noua
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

// ── PRICE MANAGEMENT ──
const DEFAULT_PRICES = [
    { id: 'espresso',          name: 'Espresso',                      priceDisplay: '9 / 10', note: 'Single / Double' },
    { id: 'presso',            name: 'Presso',                        priceDisplay: '13' },
    { id: 'cortado',           name: 'Cortado',                       priceDisplay: '11' },
    { id: 'americano',         name: 'Americano',                     priceDisplay: '10' },
    { id: 'cappuccino',        name: 'Cappuccino',                    priceDisplay: '13' },
    { id: 'flat_white',        name: 'Flat White',                    priceDisplay: '14' },
    { id: 'latte_macchiato',   name: 'Latte Macchiato',               priceDisplay: '14' },
    { id: 'iced_coffee',       name: 'Iced Coffee',                   priceDisplay: '15' },
    { id: 'pistachio_latte',   name: 'Pistachio Strawberry Iced Latte', priceDisplay: '17' },
    { id: 'tiramisu_latte',    name: 'Tiramisu Iced Latte',           priceDisplay: '17' },
    { id: 'cold_brew_tonic',   name: 'Cold Brew Tonic',               priceDisplay: '16' },
    { id: 'tropical_cold_brew',name: 'Tropical Cold Brew',            priceDisplay: '16' },
]

window.openPricesModal = async function() {
    const modal = document.getElementById('prices-modal')
    const body = document.getElementById('prices-form-body')
    body.innerHTML = '<p style="color: var(--text-muted); font-family: \'Inter\', sans-serif;">Se încarcă prețurile...</p>'
    modal.classList.add('active')

    let savedPrices = {}
    try {
        const raw = await SupabaseService.getSetting('presso_prices')
        if (raw) {
            savedPrices = typeof raw === 'string' ? JSON.parse(raw) : raw
        }
    } catch (e) { console.warn('Could not load saved prices:', e) }

    body.innerHTML = ''
    DEFAULT_PRICES.forEach(item => {
        const saved = savedPrices[item.id]
        const isEspresso = item.id === 'espresso'

        const row = document.createElement('div')
        row.style.cssText = 'display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 10px;'

        if (isEspresso) {
            const single = saved ? (saved.single || '9') : '9'
            const double = saved ? (saved.double || '10') : '10'
            row.innerHTML = `
                <span style="flex: 1; font-family: 'Inter', sans-serif; font-weight: 600; color: var(--text-main);">${item.name}</span>
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <input type="number" id="price-${item.id}-single" value="${single}" min="0" step="0.5"
                        style="width: 70px; padding: 0.4rem 0.5rem; border: 1px solid var(--glass-border); border-radius: 6px; background: var(--bg-color); color: var(--text-main); font-family: 'Inter', sans-serif; text-align: center;">
                    <span style="color: var(--text-muted); font-size: 0.8rem;">Single</span>
                    <span style="color: var(--text-muted);">/</span>
                    <input type="number" id="price-${item.id}-double" value="${double}" min="0" step="0.5"
                        style="width: 70px; padding: 0.4rem 0.5rem; border: 1px solid var(--glass-border); border-radius: 6px; background: var(--bg-color); color: var(--text-main); font-family: 'Inter', sans-serif; text-align: center;">
                    <span style="color: var(--text-muted); font-size: 0.8rem;">Double</span>
                    <span style="color: var(--primary-brown); font-weight: 600; font-family: 'Inter', sans-serif; margin-left: 0.25rem;">lei</span>
                </div>
            `
        } else {
            const price = saved ? (saved.price || item.priceDisplay) : item.priceDisplay
            row.innerHTML = `
                <span style="flex: 1; font-family: 'Inter', sans-serif; font-weight: 600; color: var(--text-main);">${item.name}</span>
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <input type="number" id="price-${item.id}" value="${price}" min="0" step="0.5"
                        style="width: 80px; padding: 0.4rem 0.5rem; border: 1px solid var(--glass-border); border-radius: 6px; background: var(--bg-color); color: var(--text-main); font-family: 'Inter', sans-serif; text-align: center;">
                    <span style="color: var(--primary-brown); font-weight: 600; font-family: 'Inter', sans-serif;">lei</span>
                </div>
            `
        }
        body.appendChild(row)
    })
}

window.closePricesModal = function() {
    document.getElementById('prices-modal').classList.remove('active')
}

window.savePrices = async function() {
    const prices = {}
    DEFAULT_PRICES.forEach(item => {
        if (item.id === 'espresso') {
            const single = document.getElementById('price-espresso-single')?.value || '9'
            const double = document.getElementById('price-espresso-double')?.value || '10'
            prices['espresso'] = { single, double }
        } else {
            const val = document.getElementById(`price-${item.id}`)?.value || item.priceDisplay
            prices[item.id] = { price: val }
        }
    })

    try {
        await SupabaseService.setSetting('presso_prices', JSON.stringify(prices))
        closePricesModal()
        alert('✅ Prețurile au fost salvate cu succes!')
    } catch (err) {
        console.error('Error saving prices:', err)
        alert('Eroare la salvarea prețurilor.')
    }
}

initAdmin()
