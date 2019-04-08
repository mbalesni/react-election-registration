import iziToast from 'izitoast'

const MAX_SCREEN_WIDTH = 600

export function isMobileScreen() {
    return window.innerWidth <= MAX_SCREEN_WIDTH
}

export function showNotification({ title, message, icon, options }) {
    iziToast.show({
        title: title || '',
        message: message || '',
        icon,
        iconColor: '#fff',
        backgroundColor: '#E15240',
        position: 'topRight',
        titleColor: '#fff',
        messageColor: '#fff',
        maxWidth: isMobileScreen() ? '100%' : '350px',
        layout: 2,
        timeout: 15 * 1000,
        transitionIn: 'bounceInLeft',
        resetOnHover: true,
        progressBar: true,
        drag: false,
        ...options
    })
}