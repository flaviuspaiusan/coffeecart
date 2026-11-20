/**
 * Impact Coffee - Pagina 1: POS / Preluare Comenzi
 * Apăsare directă pe buton pentru a trimite comanda la bar
 */
import { MENU_DRINKS, orderStore } from './bar-store.js'

// Elemente DOM
const drinksGrid = document.getElementById('drinks-grid')
const toastNotice = document.getElementById('toast-notice')
const toastMessage = document.getElementById('toast-message')
const toastUndoBtn = document.getElementById('toast-undo-btn')
const totalCupsHeader = document.getElementById('total-cups-header')
const recentOrdersList = document.getElementById('recent-orders-list')

// Modal Statistici
const statsModal = document.getElementById('stats-modal')
const btnOpenStats = document.getElementById('btn-open-stats')
const btnCloseStats = document.getElementById('btn-close-stats')
const statsTotalDisplay = document.getElementById('stats-total-display')
const statsGrid = document.getElementById('stats-grid')
const btnResetStats = document.getElementById('btn-reset-stats')

let lastPlacedOrderId = null
let undoTimer = null

function init() {
    renderMenu()
    setupEventListeners()
    updateUI()
    renderStats()
    renderRecentOrders()

    orderStore.subscribe(() => {
        updateUI()
        renderStats()
        renderRecentOrders()
    })
}

// Randare Butoane Mari Băuturi
function renderMenu() {
    drinksGrid.innerHTML = ''

    MENU_DRINKS.forEach(drink => {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'drink-btn'
        btn.dataset.id = drink.id
        btn.setAttribute('aria-label', `Comandă ${drink.name}`)

        btn.innerHTML = `
            <div class="drink-image-wrap">
                <img src="${drink.image}" alt="${drink.name}" class="drink-img" loading="lazy" onerror="this.src='/assets/espresso_image_1778599544907.webp'">
            </div>
            <div class="drink-info">
                <h2 class="drink-title">${drink.name}</h2>
                <span class="drink-meta">${drink.subtitle}</span>
            </div>
            <div class="quick-tap-badge">
                Trimite comanda
            </div>
        `

        btn.addEventListener('click', () => handleDrinkClick(drink))
        drinksGrid.appendChild(btn)
    })
}

// Apăsare directă pe buton: comanda pleacă imediat la bar!
function handleDrinkClick(drink) {
    const order = orderStore.createOrder([
        { id: drink.id, name: drink.name, qty: 1 }
    ])

    showToast(`Comanda #${order.orderNumber} trimisă: 1x ${drink.name}`, order.id)
}

// Toast confirmare cu buton de anulare
function showToast(message, orderId) {
    lastPlacedOrderId = orderId
    toastMessage.textContent = message
    toastNotice.classList.add('show')

    if (undoTimer) clearTimeout(undoTimer)
    undoTimer = setTimeout(() => {
        toastNotice.classList.remove('show')
    }, 5000)
}

toastUndoBtn.addEventListener('click', () => {
    if (lastPlacedOrderId) {
        orderStore.cancelOrder(lastPlacedOrderId)
        toastNotice.classList.remove('show')
        lastPlacedOrderId = null
        if (undoTimer) clearTimeout(undoTimer)
    }
})

// Randare comenzi recente (fără emoticoane)
function renderRecentOrders() {
    if (!recentOrdersList) return
    const recent = orderStore.orders.slice(0, 5)

    if (recent.length === 0) {
        recentOrdersList.innerHTML = `<p style="color: var(--text-light-muted); font-size: 0.9rem; text-align: center; padding: 1rem;">Nu s-a trimis nicio comandă încă.</p>`
        return
    }

    recentOrdersList.innerHTML = recent.map(o => {
        const time = new Date(o.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
        const isDone = o.status === 'completed'
        const itemsStr = o.items.map(i => `<strong>${i.qty}x</strong> ${i.name}`).join(', ')

        return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; background: rgba(2, 20, 53, 0.6); border-radius: 8px; margin-bottom: 0.5rem; border: 1px solid var(--navy-border); font-size: 0.92rem; color: var(--white);">
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <span style="font-family: var(--font-heading); font-weight: 800; color: var(--gold-light); font-size: 1.05rem;">#${o.orderNumber}</span>
                    <span>${itemsStr}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-size: 0.8rem; color: var(--text-light-muted);">${time}</span>
                    <span style="display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: 700; background: ${isDone ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; color: ${isDone ? '#4ade80' : '#fbbf24'}; border: 1px solid ${isDone ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'};">
                        ${isDone ? 'Finalizată' : 'În preparare'}
                    </span>
                </div>
            </div>
        `
    }).join('')
}

// Randare statistici în modal
function renderStats() {
    const stats = orderStore.stats
    const total = stats.total || 0

    if (totalCupsHeader) totalCupsHeader.textContent = total
    if (statsTotalDisplay) statsTotalDisplay.textContent = total

    if (!statsGrid) return
    statsGrid.innerHTML = ''

    MENU_DRINKS.forEach(drink => {
        const count = stats[drink.name] || 0
        const percent = total > 0 ? Math.round((count / total) * 100) : 0

        const card = document.createElement('div')
        card.className = 'drink-stat-card'
        card.innerHTML = `
            <div class="drink-stat-top">
                <span class="drink-stat-title">${drink.name}</span>
                <span class="drink-stat-count">${count} <small style="font-size: 0.8rem; font-weight: 600;">buc</small></span>
            </div>
            <div class="stat-progress-bar-wrap">
                <div class="stat-progress-fill" style="width: ${percent}%;"></div>
            </div>
            <div class="drink-stat-footer">
                <span>Pondere în comenzi</span>
                <strong>${percent}%</strong>
            </div>
        `
        statsGrid.appendChild(card)
    })
}

function updateUI() {
    const total = orderStore.stats.total || 0
    if (totalCupsHeader) totalCupsHeader.textContent = total
}

function setupEventListeners() {
    btnOpenStats.addEventListener('click', () => {
        renderStats()
        statsModal.classList.add('open')
    })

    btnCloseStats.addEventListener('click', () => {
        statsModal.classList.remove('open')
    })

    statsModal.addEventListener('click', (e) => {
        if (e.target === statsModal) {
            statsModal.classList.remove('open')
        }
    })

    btnResetStats.addEventListener('click', () => {
        if (confirm('Sigur dorești să resetezi contorul de statistici pentru o zi nouă?')) {
            orderStore.resetStats()
            renderStats()
        }
    })
}

document.addEventListener('DOMContentLoaded', init)
