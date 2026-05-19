import { SupabaseService } from './supabase.js'

document.getElementById('oferta-form').addEventListener('submit', async function(e) {
    e.preventDefault()

    const submitBtn = document.getElementById('submit-btn')
    const originalBtnText = submitBtn.innerText
    submitBtn.innerText = 'Se trimite...'
    submitBtn.disabled = true

    const oferta = {
        id: 'of_' + Date.now(),
        nume: document.getElementById('nume').value,
        email: document.getElementById('email').value,
        telefon: document.getElementById('telefon').value,
        companie: document.getElementById('companie').value,
        locatie: document.getElementById('locatie').value,
        data: document.getElementById('data-eveniment').value,
        invitati: document.getElementById('nr-invitati').value,
        comentarii: document.getElementById('comentarii').value,
        timestamp: new Date().toISOString()
    }

    try {
        await SupabaseService.createOffer(oferta)

        const successMsg = document.getElementById('success-message')
        successMsg.style.display = 'block'
        submitBtn.style.display = 'none'

        this.reset()

        setTimeout(() => {
            successMsg.style.display = 'none'
            submitBtn.style.display = 'block'
            submitBtn.innerText = originalBtnText
            submitBtn.disabled = false
        }, 5000)
    } catch (err) {
        console.error('Eroare Supabase:', err)
        alert('A apărut o eroare la trimiterea solicitării. Te rugăm să încerci din nou.')
        submitBtn.innerText = originalBtnText
        submitBtn.disabled = false
    }
})
