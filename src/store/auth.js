import CONFIG, { API } from '../config'
import { handleApiError, handleErrorCode } from '../errors'
import { checkIsElectionTime } from '../utils/functions'

const INITIAL_STATE = {
    loggedIn: false,
    user: '',
    structuralUnit: '',
    isElectionTime: false,
}

export default store => {
    let pulseInterval = null
    store.on('@init', () => ({ auth: INITIAL_STATE }));

    store.on('auth/get', ({ auth }) => {
        store.dispatch('appGlobal/loadingStart')
        console.log('getting Auth')

        return API.regback.post('/me', {})
            .then(res => {
                if (res.data.error) return handleErrorCode(res.data.error.code)
                const {
                    first_name,
                    last_name,
                    structural_unit_name,
                    vote_start_timestamp,
                    vote_end_timestamp
                } = res.data.data.staff
                const isElectionTime = checkIsElectionTime(vote_start_timestamp, vote_end_timestamp)

                store.dispatch('auth/save', {
                    loggedIn: true,
                    user: `${first_name} ${last_name}`,
                    structuralUnit: structural_unit_name,
                    voteStartTimestamp: vote_start_timestamp,
                    voteEndTimestamp: vote_end_timestamp,
                    isElectionTime,
                })

                store.dispatch('session/closeAll')
                if (CONFIG.PRINT_BALLOTS) store.dispatch('printer/getPrinterList')
            })
            .catch(err => {
                handleApiError(err)
                store.dispatch('auth/failed')
            })
            .finally(() => {
                store.dispatch('appGlobal/loadingEnd')
            })
    })

    store.on('auth/save', ({ auth }, data) => {
        pulseInterval = setInterval(pulse, CONFIG.PULSE_INTERVAL * 1000)

        return {
            auth: {
                ...auth,
                ...data,
            }
        };
    });

    store.on('auth/logout', () => {
        API.regback
            .post('/logout')
            .then(res => {
                if (res.data.error) return handleErrorCode(res.data.error.code)
                store.dispatch('auth/expired')
            })
            .catch(err => {
                handleApiError(err)
            })
    })

    store.on('auth/failed', ({ auth }) => {
        return { auth: { ...auth, loggedIn: false } }
    })

    store.on('auth/expired', () => {
        localStorage.removeItem('authToken')
        clearInterval(pulseInterval)
        store.dispatch('session/end')
        return { auth: INITIAL_STATE }
    })

};

function pulse() {
    console.log('pulse')

    API.regback.post('/me', {})
        .then(res => {
            if (res.data.error) handleErrorCode(res.data.error.code)
        })
        .catch(err => {
            handleApiError(err)
        })
}
