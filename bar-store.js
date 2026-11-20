/**
 * Presso Coffee Bar - Shared Store & Realtime Synchronization
 * Sincronizare între Casa/POS (Preluare Comenzi) și Ecranul Barista (KDS)
 * + Stocare locală persistentă + BroadcastChannel + Supabase Realtime
 */

// Meniul solicitat cu cele 7 băuturi exacte
export const MENU_DRINKS = [
    {
        id: 'espresso_single',
        name: 'Espresso single',
        subtitle: '20 - 30 ml',
        desc: 'Shot intens de cafea de specialitate',
        image: '/assets/drink_espresso_single.jpg'
    },
    {
        id: 'double',
        name: 'Double',
        subtitle: '40 - 50 ml',
        desc: 'Dublu espresso bogat și concentrat',
        image: '/assets/drink_double.jpg'
    },
    {
        id: 'cortado',
        name: 'Cortado',
        subtitle: '80 ml',
        desc: '1 shot espresso + cremă fină de lapte',
        image: '/assets/drink_cortado.jpg'
    },
    {
        id: 'americano',
        name: 'Americano',
        subtitle: '120 ml',
        desc: 'Shot espresso prelungit cu apă fierbinte',
        image: '/assets/drink_americano.jpg'
    },
    {
        id: 'cappucino',
        name: 'Cappucino',
        subtitle: '180 ml',
        desc: 'Espresso echilibrat cu spumă mătăsoasă',
        image: '/assets/drink_cappucino.jpg'
    },
    {
        id: 'flat_white',
        name: 'Flat white',
        subtitle: '180 ml',
        desc: 'Dublu shot espresso + micro-cremă densă',
        image: '/assets/drink_flat_white.jpg'
    },
    {
        id: 'latte',
        name: 'Latte',
        subtitle: '250 ml',
        desc: 'Espresso delicat și lapte catifelat',
        image: '/assets/drink_latte.jpg'
    }
]

// Modificatori rapizi (opționali la comandă)
export const QUICK_MODIFIERS = [
    'Lapte de ovăz',
    'Fără zahăr',
    'Decaf',
    'Extra shot',
    'To-Go (Pahar carton)'
]

const STORAGE_KEYS = {
    ORDERS: 'presso_kds_orders_v2',
    STATS: 'presso_kds_stats_v2',
    ORDER_SEQ: 'presso_kds_seq_v2',
    SOUND_ENABLED: 'presso_sound_enabled'
}

const safeStorage = {
    getItem(key) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(key)
            }
        } catch {}
        return null
    },
    setItem(key, val) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, val)
            }
        } catch {}
    }
}

class BarStore {
    constructor() {
        this.orders = this.loadOrders()
        this.stats = this.loadStats()

        // Auto-reconciliere: dacă statisticile sunt 0 (de la reset anterior), curățăm și comenzile vechi
        if (this.stats && this.stats.total === 0 && this.orders && this.orders.length > 0) {
            const hasOnlyZeroDrinks = Object.entries(this.stats).every(([k, v]) => k === 'total' || v === 0)
            if (hasOnlyZeroDrinks) {
                this.orders = []
                this.saveOrders()
            }
        }

        this.listeners = new Set()
        this.audioEnabled = safeStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) !== 'false'
        this.audioCtx = null

        // Canal de comunicare instantanee între tab-uri / ferestre
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                this.channel = new BroadcastChannel('presso_coffee_channel')
                this.channel.onmessage = (event) => this.handleBroadcastMessage(event.data)
            } else {
                this.channel = null
            }
        } catch (e) {
            console.warn('BroadcastChannel nu este suportat, folosim storage event fallback', e)
            this.channel = null
        }

        // Fallback cross-tab prin localStorage
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', (e) => {
                if (e.key === STORAGE_KEYS.ORDERS || e.key === STORAGE_KEYS.STATS) {
                    this.orders = this.loadOrders()
                    this.stats = this.loadStats()
                    this.notifyListeners()
                }
            })
        }

        // Deblocare AudioContext la prima interacțiune
        this.setupAudioUnlock()
    }

    loadOrders() {
        try {
            const raw = safeStorage.getItem(STORAGE_KEYS.ORDERS)
            return raw ? JSON.parse(raw) : []
        } catch {
            return []
        }
    }

    saveOrders() {
        try {
            safeStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders))
        } catch (e) {
            console.error('Eroare salvare comenzi:', e)
        }
    }

    loadStats() {
        const defaultStats = {
            'Espresso single': 0,
            'Double': 0,
            'Cortado': 0,
            'Americano': 0,
            'Cappucino': 0,
            'Flat white': 0,
            'Latte': 0,
            total: 0
        }
        try {
            const raw = safeStorage.getItem(STORAGE_KEYS.STATS)
            if (!raw) return defaultStats
            const parsed = JSON.parse(raw)
            return { ...defaultStats, ...parsed }
        } catch {
            return defaultStats
        }
    }

    saveStats() {
        try {
            safeStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(this.stats))
        } catch (e) {
            console.error('Eroare salvare statistici:', e)
        }
    }

    getNextOrderNumber() {
        let seq = parseInt(safeStorage.getItem(STORAGE_KEYS.ORDER_SEQ) || '0', 10) + 1
        safeStorage.setItem(STORAGE_KEYS.ORDER_SEQ, seq.toString())
        return seq
    }

    // Audio & Haptics
    setupAudioUnlock() {
        if (typeof document === 'undefined') return
        const unlock = () => {
            if (!this.audioCtx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext
                if (AudioCtx) this.audioCtx = new AudioCtx()
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume()
            }
        }
        document.addEventListener('click', unlock, { once: false, passive: true })
        document.addEventListener('touchstart', unlock, { once: false, passive: true })
    }

    playNewOrderSound() {
        if (!this.audioEnabled) return
        try {
            if (!this.audioCtx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext
                if (AudioCtx) this.audioCtx = new AudioCtx()
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume()
            }
            if (!this.audioCtx) return

            const now = this.audioCtx.currentTime
            // Chime melodic prietenos: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
            const notes = [
                { freq: 523.25, time: 0, duration: 0.15 },
                { freq: 659.25, time: 0.12, duration: 0.18 },
                { freq: 783.99, time: 0.25, duration: 0.4 }
            ]

            notes.forEach(n => {
                const osc = this.audioCtx.createOscillator()
                const gain = this.audioCtx.createGain()
                osc.type = 'triangle'
                osc.frequency.setValueAtTime(n.freq, now + n.time)

                gain.gain.setValueAtTime(0, now + n.time)
                gain.gain.linearRampToValueAtTime(0.4, now + n.time + 0.02)
                gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.duration)

                osc.connect(gain)
                gain.connect(this.audioCtx.destination)
                osc.start(now + n.time)
                osc.stop(now + n.time + n.duration + 0.05)
            })
        } catch (e) {
            console.warn('Nu s-a putut reda sunetul:', e)
        }
    }

    playCompleteSound() {
        if (!this.audioEnabled) return
        try {
            if (!this.audioCtx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext
                if (AudioCtx) this.audioCtx = new AudioCtx()
            }
            if (!this.audioCtx) return

            const now = this.audioCtx.currentTime
            // Sunet de confirmare / succes
            const osc = this.audioCtx.createOscillator()
            const gain = this.audioCtx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(587.33, now) // D5
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.1) // A5

            gain.gain.setValueAtTime(0, now)
            gain.gain.linearRampToValueAtTime(0.35, now + 0.03)
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

            osc.connect(gain)
            gain.connect(this.audioCtx.destination)
            osc.start(now)
            osc.stop(now + 0.4)
        } catch (e) {
            console.warn('Audio err:', e)
        }
    }

    vibrate(pattern = [40, 30, 40]) {
        if (navigator.vibrate) {
            try { navigator.vibrate(pattern) } catch {}
        }
    }

    // Gestionare comenzi
    createOrder(items, modifiers = [], customNote = '') {
        const orderNumber = this.getNextOrderNumber()
        let totalCups = 0

        // Normalizare elemente
        const orderItems = items.map(it => {
            const qty = it.qty || 1
            totalCups += qty
            return {
                id: it.id,
                name: it.name,
                qty: qty,
                notes: it.notes || ''
            }
        })

        const newOrder = {
            id: 'ord_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            orderNumber: orderNumber,
            items: orderItems,
            modifiers: Array.from(new Set(modifiers)),
            customNote: customNote.trim(),
            status: 'pending',
            createdAt: new Date().toISOString(),
            completedAt: null,
            totalCups: totalCups
        }

        // Actualizare comenzi
        this.orders.unshift(newOrder)
        this.saveOrders()

        // Actualizare statistici
        orderItems.forEach(it => {
            if (this.stats[it.name] !== undefined) {
                this.stats[it.name] += it.qty
            } else {
                this.stats[it.name] = it.qty
            }
            this.stats.total += it.qty
        })
        this.saveStats()

        // Feedback local
        this.vibrate([60])
        this.playNewOrderSound()

        // Notificare celelalte taburi/ecrane
        this.broadcast({
            type: 'NEW_ORDER',
            order: newOrder,
            stats: this.stats
        })

        // Sincronizare opțională în fundal cu Supabase
        this.syncOrderToSupabase(newOrder)

        this.notifyListeners()
        return newOrder
    }

    completeOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId)
        if (!order) return null

        order.status = 'completed'
        order.completedAt = new Date().toISOString()
        this.saveOrders()

        this.vibrate([80])
        this.playCompleteSound()

        this.broadcast({
            type: 'ORDER_COMPLETED',
            orderId: orderId,
            completedAt: order.completedAt
        })

        // Actualizare Supabase dacă este disponibil
        this.syncStatusToSupabase(orderId, 'completed')

        this.notifyListeners()
        return order
    }

    undoCompleteOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId)
        if (!order) return null

        order.status = 'pending'
        order.completedAt = null
        this.saveOrders()

        this.vibrate([40])
        this.broadcast({
            type: 'ORDER_UNDO',
            orderId: orderId
        })

        this.syncStatusToSupabase(orderId, 'pending')
        this.notifyListeners()
        return order
    }

    cancelOrder(orderId) {
        const index = this.orders.findIndex(o => o.id === orderId)
        if (index === -1) return false

        const removed = this.orders[index]
        // Scădere din statistici dacă a fost anulată rapid
        removed.items.forEach(it => {
            if (this.stats[it.name] && this.stats[it.name] >= it.qty) {
                this.stats[it.name] -= it.qty
            }
            if (this.stats.total >= it.qty) {
                this.stats.total -= it.qty
            }
        })
        this.saveStats()

        this.orders.splice(index, 1)
        this.saveOrders()

        this.broadcast({
            type: 'ORDER_CANCELLED',
            orderId: orderId,
            stats: this.stats
        })

        this.notifyListeners()
        return true
    }

    resetStats() {
        this.stats = {
            'Espresso single': 0,
            'Double': 0,
            'Cortado': 0,
            'Americano': 0,
            'Cappucino': 0,
            'Flat white': 0,
            'Latte': 0,
            total: 0
        }
        this.orders = []
        safeStorage.setItem(STORAGE_KEYS.ORDER_SEQ, '0')
        this.saveStats()
        this.saveOrders()
        this.broadcast({ type: 'RESET_ALL', stats: this.stats })
        this.notifyListeners()
    }

    clearCompletedOrders() {
        this.orders = this.orders.filter(o => o.status !== 'completed')
        this.saveOrders()
        this.broadcast({ type: 'CLEAR_COMPLETED' })
        this.notifyListeners()
    }

    resetAllData() {
        this.resetStats()
    }

    // Broadcast & Listeners
    broadcast(message) {
        if (this.channel) {
            try {
                this.channel.postMessage(message)
            } catch (e) {
                console.warn('Broadcast error:', e)
            }
        }
    }

    handleBroadcastMessage(msg) {
        if (!msg || !msg.type) return

        switch (msg.type) {
            case 'NEW_ORDER':
                // Evităm duplicatele
                if (!this.orders.some(o => o.id === msg.order.id)) {
                    this.orders.unshift(msg.order)
                    if (msg.stats) this.stats = msg.stats
                    this.saveOrders()
                    this.saveStats()
                    this.playNewOrderSound()
                    this.vibrate([70])
                }
                break

            case 'ORDER_COMPLETED':
                const ord = this.orders.find(o => o.id === msg.orderId)
                if (ord) {
                    ord.status = 'completed'
                    ord.completedAt = msg.completedAt || new Date().toISOString()
                    this.saveOrders()
                    this.playCompleteSound()
                }
                break

            case 'ORDER_UNDO':
                const unOrd = this.orders.find(o => o.id === msg.orderId)
                if (unOrd) {
                    unOrd.status = 'pending'
                    unOrd.completedAt = null
                    this.saveOrders()
                }
                break

            case 'ORDER_CANCELLED':
                this.orders = this.orders.filter(o => o.id !== msg.orderId)
                if (msg.stats) this.stats = msg.stats
                this.saveOrders()
                this.saveStats()
                break

            case 'STATS_RESET':
            case 'RESET_ALL':
                this.orders = []
                this.stats = msg.stats || this.loadStats()
                this.saveOrders()
                this.saveStats()
                break

            case 'CLEAR_COMPLETED':
                this.orders = this.orders.filter(o => o.status !== 'completed')
                this.saveOrders()
                break
        }

        this.notifyListeners()
    }

    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    notifyListeners() {
        this.listeners.forEach(fn => {
            try { fn({ orders: this.orders, stats: this.stats }) } catch (e) { console.error(e) }
        })
    }

    toggleSound() {
        this.audioEnabled = !this.audioEnabled
        safeStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, this.audioEnabled ? 'true' : 'false')
        return this.audioEnabled
    }

    // Integrare opțională cu Supabase dacă conexiunea este activă
    async syncOrderToSupabase(order) {
        try {
            const { SupabaseService } = await import('./supabase.js')
            if (SupabaseService && typeof SupabaseService.createOrder === 'function') {
                const itemSummary = order.items.map(it => `${it.qty}x ${it.name}`).join(', ')
                await SupabaseService.createOrder({
                    id: order.id,
                    orderNumber: order.orderNumber,
                    itemName: itemSummary,
                    customerName: `Comandă #${order.orderNumber}` + (order.modifiers.length ? ` (${order.modifiers.join(', ')})` : ''),
                    status: 'pending',
                    timestamp: order.createdAt
                })
            }
        } catch {
            // Nu blocăm funcționalitatea locală dacă Supabase nu răspunde
        }
    }

    async syncStatusToSupabase(orderId, status) {
        try {
            const { SupabaseService } = await import('./supabase.js')
            if (SupabaseService && typeof SupabaseService.updateOrderStatus === 'function') {
                await SupabaseService.updateOrderStatus(orderId, status)
            }
        } catch {
            // Ignorăm erorile de rețea în fundal
        }
    }
}

export const orderStore = new BarStore()
