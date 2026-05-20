import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const SupabaseService = {
    // Orders
    async getOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('timestamp', { ascending: false })
        if (error) throw error
        return data
    },

    async createOrder(order) {
        const { data, error } = await supabase
            .from('orders')
            .insert([order])
        if (error) throw error
        return data
    },

    async updateOrderStatus(orderId, status) {
        const updateData = { status }
        if (status === 'completed') {
            updateData.servedAt = new Date().toISOString()
        }
        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId)
        if (error) throw error
        return data
    },

    async clearOrders(activeEventId) {
        if (activeEventId) {
            const { error } = await supabase
                .from('orders')
                .delete()
                .or(`eventId.eq.${activeEventId},eventId.is.null`)
            if (error) throw error
        } else {
            const { error } = await supabase
                .from('orders')
                .delete()
                .is('eventId', null)
            if (error) throw error
        }
    },

    async getOrdersByEvent(eventId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('eventId', eventId)
            .order('timestamp', { ascending: true })
        if (error) throw error
        return data
    },

    // Events
    async getEvents() {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('timestamp', { ascending: false })
        if (error) throw error
        return data
    },

    async createEvent(event) {
        const { data, error } = await supabase
            .from('events')
            .insert([event])
        if (error) throw error
        return data
    },

    async updateEventStatus(eventId, status) {
        const { data, error } = await supabase
            .from('events')
            .update({ status })
            .eq('id', eventId)
        if (error) throw error
        return data
    },

    async deleteEvent(eventId) {
        const { error: errorEvent } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId)
        if (errorEvent) throw errorEvent
    },

    async clearCompletedEvents() {
        const { error: errorEvents } = await supabase
            .from('events')
            .delete()
            .eq('status', 'completed')
        if (errorEvents) throw errorEvents
    },

    // Menu
    async getMenuItems() {
        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
        if (error) throw error
        return data
    },

    async saveMenuItem(item) {
        const { data, error } = await supabase
            .from('menu_items')
            .upsert([item])
        if (error) throw error
        return data
    },

    async deleteMenuItem(id) {
        const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', id)
        if (error) throw error
    },

    // Offers
    async getOffers() {
        const { data, error } = await supabase
            .from('offers')
            .select('*')
            .order('timestamp', { ascending: false })
        if (error) throw error
        return data
    },

    async createOffer(offer) {
        const { data, error } = await supabase
            .from('offers')
            .insert([offer])
        if (error) throw error
        return data
    },

    async deleteOffer(id) {
        const { error } = await supabase
            .from('offers')
            .delete()
            .eq('id', id)
        if (error) throw error
    },

    async clearOffers() {
        const { error } = await supabase
            .from('offers')
            .delete()
            .neq('id', '0')
        if (error) throw error
    },

    // Settings
    async getSetting(key) {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .limit(1)
        if (error) {
            console.error('getSetting error for', key, error)
            return null
        }
        return data && data.length > 0 ? data[0].value : null
    },

    async setSetting(key, value) {
        // Try update first (works if row exists)
        const { data: existing } = await supabase
            .from('settings')
            .select('key')
            .eq('key', key)
            .limit(1)

        if (existing && existing.length > 0) {
            const { data, error } = await supabase
                .from('settings')
                .update({ value })
                .eq('key', key)
            if (error) throw error
            return data
        } else {
            const { data, error } = await supabase
                .from('settings')
                .insert([{ key, value }])
            if (error) throw error
            return data
        }
    },

    // Real-time subscriptions
    subscribeToOrders(callback) {
        return supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
            .subscribe()
    },

    subscribeToMenu(callback) {
        return supabase
            .channel('public:menu_items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, callback)
            .subscribe()
    },

    subscribeToSettings(callback) {
        return supabase
            .channel('public:settings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, callback)
            .subscribe()
    }
}
