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

export function localDateTimeFromUTC(UTCTimeString) {
    try {
        // parse date time string
        let year = parseInt(UTCTimeString.slice(0, 4))
        let month = parseInt(UTCTimeString.slice(5, 7)) - 1
        let date = parseInt(UTCTimeString.slice(8, 10))
        let hours = parseInt(UTCTimeString.slice(11, 13))
        let minutes = parseInt(UTCTimeString.slice(14, 16))
        let seconds = parseInt(UTCTimeString.slice(17, 19))

        // convert input UTC datetime to local
        let localDateTime = new Date(Date.UTC(year, month, date, hours, minutes, seconds))

        return localDateTime
    } catch (err) {
        return err
    }
}