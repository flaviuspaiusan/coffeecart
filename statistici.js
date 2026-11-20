/**
 * Presso Coffee Bar - Pagina de Statistici & Rapoarte
 * Monitorizare în timp real pentru cele 7 băuturi și total
 */
import { orderStore, MENU_DRINKS } from './bar-store.js'

// Elemente DOM
const totalDisplay = document.getElementById('stats-total-huge')
const pendingCountDisplay = document.getElementById('stats-pending-count')
const completedCountDisplay = document.getElementById('stats-completed-count')
const topDrinkNameDisplay = document.getElementById('stats-top-drink')
const drinksDetailGrid = document.getElementById('drinks-detail-grid')
const btnResetAll = document.getElementById('btn-reset-stats-page')
const btnExportCsv = document.getElementById('btn-export-csv')
const statsLiveIndicator = document.getElementById('stats-live-time')

function init() {
    renderAllStats()
    setupEventListeners()

    // Abonare la evenimente live
    orderStore.subscribe(() => {
        renderAllStats()
    })

    // Actualizare oră curentă
    setInterval(() => {
        if (statsLiveIndicator) {
            statsLiveIndicator.textContent = new Date().toLocaleTimeString('ro-RO')
        }
    }, 1000)
}

function renderAllStats() {
    const stats = orderStore.stats
    const total = stats.total || 0
    const pending = orderStore.orders.filter(o => o.status === 'pending').length
    const completed = orderStore.orders.filter(o => o.status === 'completed').length

    if (totalDisplay) totalDisplay.textContent = total
    if (pendingCountDisplay) pendingCountDisplay.textContent = pending
    if (completedCountDisplay) completedCountDisplay.textContent = completed

    // Găsire băutură preferată (Top 1)
    let maxCount = -1
    let topDrink = '—'
    MENU_DRINKS.forEach(drink => {
        const count = stats[drink.name] || 0
        if (count > maxCount && count > 0) {
            maxCount = count
            topDrink = `${drink.name} (${count} buc)`
        }
    })
    if (topDrinkNameDisplay) topDrinkNameDisplay.textContent = topDrink

    // Randare grid detaliat
    if (!drinksDetailGrid) return
    drinksDetailGrid.innerHTML = ''

    MENU_DRINKS.forEach(drink => {
        const count = stats[drink.name] || 0
        const percent = total > 0 ? Math.round((count / total) * 100) : 0

        const card = document.createElement('div')
        card.className = 'drink-stat-card'
        card.style.padding = '1.5rem'
        card.style.background = 'rgba(2, 20, 53, 0.6)'
        card.style.border = '1px solid var(--navy-border)'
        card.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)'

        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="width: 60px; height: 60px; border-radius: 12px; background: var(--navy-dark); border: 1px solid var(--navy-border); display: flex; align-items: center; justify-content: center; padding: 5px;">
                    <img src="${drink.image}" alt="${drink.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <div>
                    <h3 style="font-family: var(--font-heading); font-size: 1.25rem; color: var(--white); line-height: 1.2;">
                        ${drink.name}
                    </h3>
                    <span style="font-size: 0.85rem; color: var(--gold-light); font-weight: 600;">${drink.subtitle}</span>
                </div>
            </div>

            <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-size: 0.88rem; color: var(--text-light-muted); font-weight: 600;">Băuturi servite:</span>
                <span style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--gold-primary);">
                    ${count} <small style="font-size: 0.9rem; font-family: var(--font-sans); color: var(--text-light-muted); font-weight: 600;">buc</small>
                </span>
            </div>

            <div class="stat-progress-bar-wrap" style="height: 12px; margin-bottom: 0.6rem; background: rgba(255, 255, 255, 0.08);">
                <div class="stat-progress-fill" style="width: ${percent}%;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-light-muted); font-weight: 600;">
                <span>Pondere din total comenzi</span>
                <strong style="color: var(--gold-light); font-size: 0.95rem;">${percent}%</strong>
            </div>
        `
        drinksDetailGrid.appendChild(card)
    })
}

function exportCsvReport() {
    const stats = orderStore.stats
    const total = stats.total || 0
    const now = new Date().toLocaleString('ro-RO')

    let csv = `RAPORT VANZARI IMPACT COFFEE\n`
    csv += `Data generarii: ${now}\n`
    csv += `Total bauturi: ${total}\n\n`
    csv += `Bautura,Cantitate,Pondere (%)\n`

    MENU_DRINKS.forEach(drink => {
        const count = stats[drink.name] || 0
        const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0
        csv += `"${drink.name}",${count},${percent}%\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `raport-impact-coffee-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

function setupEventListeners() {
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', exportCsvReport)
    }

    if (btnResetAll) {
        btnResetAll.addEventListener('click', () => {
            const confirmed = confirm('ATENȚIE: Sigur dorești să resetezi statisticile pentru o nouă zi/eveniment? Toate contoarele vor fi setate pe 0.')
            if (confirmed) {
                orderStore.resetStats()
                renderAllStats()
            }
        })
    }
}

document.addEventListener('DOMContentLoaded', init)
