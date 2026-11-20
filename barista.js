/**
 * Presso Coffee Bar - Pagina 2: Ecran Barista (KDS)
 * Afișează comenzile în timp real cu buton mare de finalizare
 */
import { orderStore, MENU_DRINKS } from './bar-store.js'

// Stare pagină
let currentTab = 'pending' // 'pending' sau 'completed'
let timerInterval = null

// Elemente DOM
const ordersGrid = document.getElementById('orders-grid')
const pendingTabBtn = document.getElementById('tab-pending')
const completedTabBtn = document.getElementById('tab-completed')
const countPendingBadge = document.getElementById('count-pending-badge')
const countCompletedBadge = document.getElementById('count-completed-badge')
const statPendingCount = document.getElementById('stat-pending-count')
const statCompletedCount = document.getElementById('stat-completed-count')
const statTotalCups = document.getElementById('stat-total-cups')
const btnToggleSound = document.getElementById('btn-toggle-sound')
const btnFullscreen = document.getElementById('btn-fullscreen')
const btnClearCompleted = document.getElementById('btn-clear-completed')

// Modal Statistici
const statsModal = document.getElementById('stats-modal')
const btnOpenStats = document.getElementById('btn-open-stats')
const btnCloseStats = document.getElementById('btn-close-stats')
const statsTotalDisplay = document.getElementById('stats-total-display')
const statsGrid = document.getElementById('stats-grid')
const btnResetStats = document.getElementById('btn-reset-stats')

function init() {
    setupEventListeners()
    renderOrders()
    updateCounters()
    renderStats()

    // Abonare la actualizări din store
    orderStore.subscribe(() => {
        renderOrders()
        updateCounters()
        renderStats()
    })

    // Actualizare automată timpi trecuți la fiecare 5 secunde
    timerInterval = setInterval(() => {
        updateTimers()
    }, 5000)

    updateSoundButton()
}

// Calcul timp trecut relativ
function getRelativeTime(isoString) {
    if (!isoString) return ''
    const now = Date.now()
    const then = new Date(isoString).getTime()
    const diffSec = Math.max(0, Math.floor((now - then) / 1000))

    if (diffSec < 60) return `acum ${diffSec}s`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `acum ${diffMin}m`
    const diffHours = Math.floor(diffMin / 60)
    return `acum ${diffHours}h ${diffMin % 60}m`
}

// Randare comenzi
function renderOrders() {
    ordersGrid.innerHTML = ''

    const filtered = orderStore.orders.filter(o => o.status === currentTab)

    if (filtered.length === 0) {
        if (currentTab === 'pending') {
            ordersGrid.innerHTML = `
                <div class="empty-state">
                    <h3>Toate comenzile sunt gata</h3>
                    <p>În acest moment nu există băuturi în așteptare. Când cineva ia o comandă pe ecranul 1, va apărea imediat aici.</p>
                </div>
            `
        } else {
            ordersGrid.innerHTML = `
                <div class="empty-state">
                    <h3>Nu există comenzi finalizate</h3>
                    <p>Comenzile finalizate vor fi arhivate aici pe durata sesiunii curente.</p>
                </div>
            `
        }
        return
    }

    filtered.forEach(order => {
        const card = createOrderCard(order)
        ordersGrid.appendChild(card)
    })
}

// Construcție Card Comandă
function createOrderCard(order) {
    const card = document.createElement('article')
    const isCompleted = order.status === 'completed'
    card.className = `order-card ${isCompleted ? 'completed-card' : ''}`
    card.dataset.id = order.id

    const createdDate = new Date(order.createdAt)
    const exactTime = createdDate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
    const relativeTime = getRelativeTime(order.createdAt)

    // Urgență dacă comanda are peste 3 minute în așteptare
    const ageMinutes = (Date.now() - createdDate.getTime()) / (1000 * 60)
    const isUrgent = !isCompleted && ageMinutes >= 3

    if (isUrgent) card.classList.add('urgent')

    // Conținut băuturi
    const itemsHtml = order.items.map(item => {
        const drinkInfo = MENU_DRINKS.find(d => d.name === item.name)
        const subtitle = drinkInfo ? drinkInfo.subtitle : ''

        return `
            <div class="order-item-row">
                <div class="order-item-left">
                    <span class="order-item-qty">${item.qty}x</span>
                    <div>
                        <div class="order-item-name">${item.name}</div>
                        ${subtitle ? `<div class="order-item-note">${subtitle}</div>` : ''}
                    </div>
                </div>
            </div>
        `
    }).join('')

    // Header card
    const headerHtml = `
        <div class="order-card-header">
            <div class="order-id-tag">
                <span>#${order.orderNumber}</span>
                <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-light-muted); margin-left: 0.35rem;">(${order.totalCups} ${order.totalCups === 1 ? 'băutură' : 'băuturi'})</span>
            </div>
            <div class="order-timer ${isUrgent ? 'urgent' : ''}" data-created="${order.createdAt}">
                <span class="timer-text">${isCompleted ? `Gata la ${new Date(order.completedAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}` : `${exactTime} (${relativeTime})`}</span>
            </div>
        </div>
    `

    // Buton acțiune (MARE, FĂRĂ EMOTICOANE)
    let footerHtml = ''
    if (!isCompleted) {
        footerHtml = `
            <div class="order-card-footer">
                <button type="button" class="btn-complete-order" data-action="complete" data-id="${order.id}">
                    <span>GATA - FINALIZEAZĂ</span>
                </button>
            </div>
        `
    } else {
        footerHtml = `
            <div class="order-card-footer" style="display: flex; gap: 0.5rem;">
                <button type="button" class="btn-undo-order" data-action="undo" data-id="${order.id}">
                    <span>Restabilește în lucru</span>
                </button>
            </div>
        `
    }

    card.innerHTML = `
        ${headerHtml}
        <div class="order-card-body">
            ${itemsHtml}
        </div>
        ${footerHtml}
    `

    // Atașare click pe butonul de acțiune
    const actionBtn = card.querySelector('[data-action]')
    if (actionBtn) {
        actionBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            const action = actionBtn.dataset.action
            if (action === 'complete') {
                // Animație de finalizare înainte de eliminare
                card.style.transform = 'scale(0.95)'
                card.style.opacity = '0.5'
                setTimeout(() => {
                    orderStore.completeOrder(order.id)
                }, 150)
            } else if (action === 'undo') {
                orderStore.undoCompleteOrder(order.id)
            }
        })
    }

    return card
}

// Actualizare dinamică a timer-elor afișate
function updateTimers() {
    if (currentTab !== 'pending') return

    const timerElements = document.querySelectorAll('.order-timer[data-created]')
    timerElements.forEach(el => {
        const createdIso = el.dataset.created
        if (createdIso) {
            const exactTime = new Date(createdIso).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
            const rel = getRelativeTime(createdIso)
            const textEl = el.querySelector('.timer-text')
            if (textEl) textEl.textContent = `${exactTime} (${rel})`

            const ageMin = (Date.now() - new Date(createdIso).getTime()) / (1000 * 60)
            if (ageMin >= 3) {
                el.classList.add('urgent')
                el.closest('.order-card')?.classList.add('urgent')
            }
        }
    })
}

// Actualizare contoare
function updateCounters() {
    const pending = orderStore.orders.filter(o => o.status === 'pending').length
    const completed = orderStore.orders.filter(o => o.status === 'completed').length
    const totalCups = orderStore.stats.total || 0

    if (countPendingBadge) countPendingBadge.textContent = pending
    if (countCompletedBadge) countCompletedBadge.textContent = completed

    if (statPendingCount) statPendingCount.textContent = pending
    if (statCompletedCount) statCompletedCount.textContent = completed
    if (statTotalCups) statTotalCups.textContent = totalCups

    if (btnClearCompleted) {
        btnClearCompleted.style.display = (currentTab === 'completed' && completed > 0) ? 'inline-flex' : 'none'
    }
}

// Randare Statistici în Modal
function renderStats() {
    const stats = orderStore.stats
    const total = stats.total || 0

    if (statsTotalDisplay) {
        statsTotalDisplay.textContent = total
    }

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
                <span>Pondre din total</span>
                <strong>${percent}%</strong>
            </div>
        `
        statsGrid.appendChild(card)
    })
}

function updateSoundButton() {
    if (!btnToggleSound) return
    const isEnabled = orderStore.audioEnabled
    if (isEnabled) {
        btnToggleSound.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
        `
        btnToggleSound.title = 'Sunet activat (apasă pentru mut)'
    } else {
        btnToggleSound.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
        `
        btnToggleSound.title = 'Sunet oprit (apasă pentru activare)'
    }
}

function setupEventListeners() {
    // Comutare taburi În așteptare / Finalizate
    pendingTabBtn.addEventListener('click', () => {
        currentTab = 'pending'
        pendingTabBtn.classList.add('active')
        completedTabBtn.classList.remove('active')
        renderOrders()
        updateCounters()
    })

    completedTabBtn.addEventListener('click', () => {
        currentTab = 'completed'
        completedTabBtn.classList.add('active')
        pendingTabBtn.classList.remove('active')
        renderOrders()
        updateCounters()
    })

    // Buton sunet
    btnToggleSound.addEventListener('click', () => {
        orderStore.toggleSound()
        updateSoundButton()
        if (orderStore.audioEnabled) {
            orderStore.playCompleteSound()
        }
    })

    // Fullscreen
    btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {})
        } else {
            document.exitFullscreen().catch(() => {})
        }
    })

    // Curățare istoric finalizate
    if (btnClearCompleted) {
        btnClearCompleted.addEventListener('click', () => {
            if (confirm('Sigur dorești să ștergi istoricul comenzilor finalizate? (Contoarele de statistici vor fi păstrate)')) {
                orderStore.clearCompletedOrders()
            }
        })
    }

    // Modal statistici
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

// Start
document.addEventListener('DOMContentLoaded', init)
