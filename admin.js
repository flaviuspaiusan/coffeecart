const ordersList = document.getElementById('orders-list');

// ── ORDERING TOGGLE ──
function updateOrderingUI() {
    const enabled = localStorage.getItem('presso_ordering') !== 'disabled';
    const btn = document.getElementById('ordering-toggle-btn');
    const txt = document.getElementById('ordering-status-text');
    if (enabled) {
        btn.textContent = 'Dezactivează Comenzile';
        btn.style.background = '#e53e3e';
        btn.style.color = 'white';
        txt.textContent = 'Comenzi Active';
        txt.style.color = 'var(--primary-green)';
    } else {
        btn.textContent = 'Activează Comenzile';
        btn.style.background = 'var(--primary-green)';
        btn.style.color = 'white';
        txt.textContent = 'Comenzi Inactive';
        txt.style.color = '#e53e3e';
    }
}

function toggleOrdering() {
    const enabled = localStorage.getItem('presso_ordering') !== 'disabled';
    localStorage.setItem('presso_ordering', enabled ? 'disabled' : 'enabled');
    updateOrderingUI();
}

updateOrderingUI();

function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('coffee_orders') || '[]');
    
    // Sort orders: pending first, then by timestamp descending
    orders.sort((a, b) => {
        if (a.status === b.status) {
            return new Date(b.timestamp) - new Date(a.timestamp);
        }
        return a.status === 'pending' ? -1 : 1;
    });
    
    renderOrders(orders);
}

function renderOrders(orders) {
    ordersList.innerHTML = '';
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Nu există comenzi momentan.</p>';
        return;
    }
    
    orders.forEach(order => {
        const date = new Date(order.timestamp);
        const timeStr = date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
        const isCompleted = order.status === 'completed';
        
        const item = document.createElement('div');
        item.className = `order-item ${isCompleted ? 'completed' : ''}`;
        
        const displayOrderNum = order.orderNumber ? `#${order.orderNumber} ` : '';
        
        item.innerHTML = `
            <div class="order-info">
                <h3>${displayOrderNum}${order.itemName} <span class="badge ${isCompleted ? 'completed' : ''}">${isCompleted ? 'Finalizată' : 'În preparare'}</span></h3>
                <p><strong>Client:</strong> ${order.customerName}</p>
                <div class="order-meta">Plasată la: ${timeStr}</div>
            </div>
            <div>
                ${!isCompleted ? `<button class="btn" onclick="markCompleted('${order.id}')" style="width: auto;">Gata de Servire</button>` : ''}
            </div>
        `;
        
        ordersList.appendChild(item);
    });
}

function markCompleted(orderId) {
    let orders = JSON.parse(localStorage.getItem('coffee_orders') || '[]');
    orders = orders.map(o => {
        if (o.id === orderId) {
            return { ...o, status: 'completed' };
        }
        return o;
    });
    
    localStorage.setItem('coffee_orders', JSON.stringify(orders));
    loadOrders();
}

function clearOrders() {
    if(confirm('Ești sigur că vrei să ștergi toate comenzile din istoric?')) {
        localStorage.removeItem('coffee_orders');
        loadOrders();
    }
}

// Listen for cross-tab updates
window.addEventListener('storage', (e) => {
    if (e.key === 'coffee_orders') {
        loadOrders();
    }
    if (e.key === 'presso_oferte') {
        loadOffers();
    }
});

// Refresh every 5 seconds just in case
setInterval(() => {
    loadOrders();
    loadOffers();
}, 5000);

// --- Menu Management ---
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
];

function getMenuItems() {
    return JSON.parse(localStorage.getItem('coffee_menu')) || defaultMenuItems;
}

let currentMenuAdmin = getMenuItems();

const orderMapAdmin = {
    'espresso': 1,
    'presso': 2,
    'cortado': 3,
    'americano': 4,
    'cappuccino': 5,
    'cappucino': 5
};

const originalOrderAdmin = currentMenuAdmin.map(i => i.id).join(',');
currentMenuAdmin.forEach((item, index) => item._origIdx = index);
currentMenuAdmin.sort((a, b) => {
    const valA = orderMapAdmin[a.name.toLowerCase()] || orderMapAdmin[a.id] || 99;
    const valB = orderMapAdmin[b.name.toLowerCase()] || orderMapAdmin[b.id] || 99;
    if (valA !== valB) return valA - valB;
    return a._origIdx - b._origIdx;
});
currentMenuAdmin.forEach(item => delete item._origIdx);

if (currentMenuAdmin.map(i => i.id).join(',') !== originalOrderAdmin) {
    localStorage.setItem('coffee_menu', JSON.stringify(currentMenuAdmin));
}

function saveMenuItems(items) {
    localStorage.setItem('coffee_menu', JSON.stringify(items));
    window.dispatchEvent(new Event('storage'));
}

function switchTab(tabId) {
    document.getElementById('section-orders').style.display = tabId === 'orders' ? 'block' : 'none';
    document.getElementById('section-menu').style.display = tabId === 'menu' ? 'block' : 'none';
    document.getElementById('section-offers').style.display = tabId === 'offers' ? 'block' : 'none';
    
    document.getElementById('tab-orders').className = tabId === 'orders' ? 'btn' : 'btn btn-secondary';
    document.getElementById('tab-menu').className = tabId === 'menu' ? 'btn' : 'btn btn-secondary';
    document.getElementById('tab-offers').className = tabId === 'offers' ? 'btn' : 'btn btn-secondary';
    
    if (tabId === 'menu') {
        loadMenu();
    } else if (tabId === 'offers') {
        loadOffers();
    } else if (tabId === 'orders') {
        loadOrders();
    }
}

function loadMenu() {
    const items = getMenuItems();
    const list = document.getElementById('admin-menu-list');
    list.innerHTML = '';
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
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
        `;
        list.appendChild(card);
    });
}

function openMenuModal() {
    document.getElementById('menu-modal-title').innerText = 'Adaugă Produs Nou';
    document.getElementById('menu-form').reset();
    document.getElementById('menu-item-id').value = '';
    document.getElementById('menu-image-data').value = '';
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('menu-modal').classList.add('active');
}

function closeMenuModal() {
    document.getElementById('menu-modal').classList.remove('active');
}

function editMenuItem(id) {
    const items = getMenuItems();
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    document.getElementById('menu-modal-title').innerText = 'Editează Produs';
    document.getElementById('menu-item-id').value = item.id;
    document.getElementById('menu-name').value = item.name;
    document.getElementById('menu-desc').value = item.desc;
    document.getElementById('menu-image-data').value = item.image;
    
    const previewContainer = document.getElementById('image-preview-container');
    const preview = document.getElementById('image-preview');
    preview.src = item.image;
    previewContainer.style.display = 'block';
    
    document.getElementById('menu-modal').classList.add('active');
}

function deleteMenuItem(id) {
    if (confirm('Ești sigur că vrei să ștergi acest produs?')) {
        let items = getMenuItems();
        items = items.filter(i => i.id !== id);
        saveMenuItems(items);
        loadMenu();
    }
}

document.getElementById('menu-image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 0.7 quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                document.getElementById('menu-image-data').value = dataUrl;
                
                const preview = document.getElementById('image-preview');
                preview.src = dataUrl;
                document.getElementById('image-preview-container').style.display = 'block';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('menu-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('menu-item-id').value || 'item_' + Date.now();
    const name = document.getElementById('menu-name').value;
    const desc = document.getElementById('menu-desc').value;
    let image = document.getElementById('menu-image-data').value;
    
    if (!image) {
        alert('Te rugăm să alegi o imagine!');
        return;
    }
    
    const items = getMenuItems();
    const existingIndex = items.findIndex(i => i.id === id);
    
    const newItem = { id, name, desc, image };
    
    if (existingIndex >= 0) {
        items[existingIndex] = newItem;
    } else {
        items.push(newItem);
    }
    
    try {
        saveMenuItems(items);
        closeMenuModal();
        loadMenu();
    } catch (err) {
        console.error('Eroare la salvare:', err);
        alert('Eroare la salvare. Poza este prea mare, chiar și după comprimare, sau spațiul de stocare e plin.');
    }
});

// --- Offers Management ---
const offersList = document.getElementById('offers-list');

function loadOffers() {
    const offers = JSON.parse(localStorage.getItem('presso_oferte') || '[]');
    offers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    renderOffers(offers);
}

function renderOffers(offers) {
    offersList.innerHTML = '';
    
    if (offers.length === 0) {
        offersList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Nu există cereri de ofertă momentan.</p>';
        return;
    }
    
    offers.forEach(oferta => {
        const date = new Date(oferta.timestamp);
        const dateStr = date.toLocaleDateString('ro-RO') + ' ' + date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
        
        const item = document.createElement('div');
        item.className = 'order-item';
        item.style.borderLeftColor = '#eab308'; // Yellow/Gold for offers
        
        item.innerHTML = `
            <div class="order-info" style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <h3>Cerere de la ${oferta.nume} <span class="badge" style="background: rgba(234, 179, 8, 0.1); color: #eab308;">Ofertă Nouă</span></h3>
                    <button class="btn btn-secondary" onclick="deleteOffer('${oferta.id}')" style="padding: 0.3rem 0.8rem; font-size: 0.85rem;">Marcată ca Citită</button>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.75rem 2rem; align-items: flex-start;">
                    <p style="white-space: nowrap;"><strong>Email:</strong> <a href="mailto:${oferta.email}" style="color: var(--primary-brown); text-decoration: none;">${oferta.email}</a></p>
                    <p style="white-space: nowrap;"><strong>Telefon:</strong> <a href="tel:${oferta.telefon}" style="color: var(--primary-brown); text-decoration: none;">${oferta.telefon}</a></p>
                    ${oferta.companie ? `<p style="white-space: nowrap;"><strong>Companie:</strong> ${oferta.companie}</p>` : ''}
                    <p style="white-space: nowrap;"><strong>Locație:</strong> ${oferta.locatie}</p>
                    <p style="white-space: nowrap;"><strong>Data Eveniment:</strong> ${oferta.data}</p>
                    <p style="white-space: nowrap;"><strong>Nr. Invitați:</strong> ${oferta.invitati} pers.</p>
                </div>
                ${oferta.comentarii ? `<div style="margin-top: 1rem; padding: 0.8rem; background: rgba(93, 64, 55, 0.03); border-radius: 8px; border: 1px solid var(--glass-border);"><strong>Comentarii / Clarificări:</strong><br><span style="white-space: pre-wrap; font-size: 0.95rem; color: var(--text-main); line-height: 1.5;">${oferta.comentarii}</span></div>` : ''}
                <div class="order-meta" style="margin-top: 1rem; border-top: 1px solid var(--glass-border); padding-top: 0.5rem; white-space: nowrap;">Trimisă la: ${dateStr}</div>
            </div>
        `;
        
        offersList.appendChild(item);
    });
}

function deleteOffer(id) {
    if (confirm('Marchezi această cerere ca rezolvată? Ea va fi ștearsă din listă.')) {
        let offers = JSON.parse(localStorage.getItem('presso_oferte') || '[]');
        offers = offers.filter(o => o.id !== id);
        localStorage.setItem('presso_oferte', JSON.stringify(offers));
        loadOffers();
    }
}

function clearOffers() {
    if(confirm('Ești sigur că vrei să ștergi toate cererile de ofertă?')) {
        localStorage.removeItem('presso_oferte');
        loadOffers();
    }
}

// Initialize
loadOrders();
loadOffers();
