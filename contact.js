// Secțiunea „Contact” din colțul dreapta-sus al header-ului.
// Se adaugă automat pe orice pagină care include acest script și are un <nav class="header-nav">.

const CONTACT = {
    phoneDisplay: '0748 151 407',
    phoneHref: 'tel:+40748151407',
    email: 'flavius.paiusan@yahoo.com',
    instagramName: 'Presso Coffee Cart',
    instagramUrl: 'https://www.instagram.com/presso.coffee.cart/',
};

const ICONS = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/></svg>',
};

function initContact() {
    const nav = document.querySelector('.header-nav');
    if (!nav || document.getElementById('contact-toggle')) return;

    const wrap = document.createElement('div');
    wrap.className = 'contact-wrap';
    wrap.innerHTML = `
        <button type="button" class="nav-link contact-toggle" id="contact-toggle" aria-expanded="false" aria-controls="contact-panel">Contact</button>
        <div class="contact-panel" id="contact-panel" role="dialog" aria-label="Date de contact">
            <p class="contact-panel-title">Hai să vorbim</p>
            <a class="contact-item" id="contact-phone" href="${CONTACT.phoneHref}">
                <span class="contact-icon">${ICONS.phone}</span>
                <span><small>Telefon</small>${CONTACT.phoneDisplay}</span>
            </a>
            <a class="contact-item" id="contact-email" href="mailto:${CONTACT.email}">
                <span class="contact-icon">${ICONS.mail}</span>
                <span><small>Email</small>${CONTACT.email}</span>
            </a>
            <a class="contact-item" id="contact-instagram" href="${CONTACT.instagramUrl}" target="_blank" rel="noopener">
                <span class="contact-icon">${ICONS.instagram}</span>
                <span><small>Instagram</small>${CONTACT.instagramName}</span>
            </a>
        </div>
    `;
    nav.appendChild(wrap);
    // Header-ul poate deveni mai înalt pe telefon -> paginile își recalculează spațiul de sus
    window.dispatchEvent(new Event('resize'));

    const toggle = wrap.querySelector('#contact-toggle');
    const setOpen = (open) => {
        wrap.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!wrap.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
        if (!wrap.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setOpen(false);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContact);
} else {
    initContact();
}
