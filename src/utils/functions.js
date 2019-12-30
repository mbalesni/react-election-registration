import iziToast from 'izitoast'
import store from '../store'

export function isMobileScreen() {
    const MAX_SCREEN_WIDTH = 600
    return window.innerWidth <= MAX_SCREEN_WIDTH
}

/**
 * Gracefully handle registration error
 * that happens due to bad connection.
 *
 * @param {object} err
 * @returns {boolean}
 */
export function shouldIgnoreRegError(err) {
    if (err.code === 304 && err.context && err.context.ballot_number) {
        return true
    }
    return false
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
        ...options,
    })
}

export function parseDTimeString(UTCTimeString) {
    try {
        // parse date time string
        let year = parseInt(UTCTimeString.slice(0, 4))
        let month = parseInt(UTCTimeString.slice(5, 7)) - 1
        let date = parseInt(UTCTimeString.slice(8, 10))
        let hours = parseInt(UTCTimeString.slice(11, 13))
        let minutes = parseInt(UTCTimeString.slice(14, 16))
        let seconds = parseInt(UTCTimeString.slice(17, 19))

        // convert input UTC datetime to local
        let localDateTime = new Date(
            Date.UTC(year, month, date, hours, minutes, seconds)
        )

        return localDateTime
    } catch (err) {
        return err
    }
}

export function checkIsElectionTime(startString, endString) {
    const start = +parseDTimeString(startString)
    const end = +parseDTimeString(endString)
    const now = +new Date()
    return now >= start && now < end
}

export function strToBool(string) {
    const YES_VALUES = ['true', 'yes', 'y', 'on', '1']
    return YES_VALUES.indexOf(string.toLowerCase()) > -1
}

export function setupAuthTokenUpdate(axiosInstance) {
    const storedAuthToken = localStorage.getItem('authToken')
    if (storedAuthToken) includeAuthToken(axiosInstance, storedAuthToken)

    axiosInstance.interceptors.response.use(
        function(response) {
            if (response.data && response.data.auth_token) {
                includeAuthToken(axiosInstance, response.data.auth_token)
                localStorage.setItem('authToken', response.data.auth_token)
            }
            if (response.status) {
                store.dispatch('appGlobal/setOnline', true)
            }
            return response
        },
        function(error) {
            return Promise.reject(error)
        }
    )
    return axiosInstance
}

export function includeAuthToken(axiosInstance, authToken) {
    axiosInstance.defaults.headers = {
        'X-Auth-Token': authToken,
    }
}

export function hasUndefinedValues(object) {
    for (let item in object) {
        if (object.hasOwnProperty(item) && object[item] === undefined) {
            return true
        }
    }
    return false
}
