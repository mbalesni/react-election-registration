import React from 'react'
import CONFIG, { API } from '../config'
import { handleApiError, handleErrorCode } from '../errors'
import { shouldIgnoreRegError } from '../utils/functions'

const { ASK_CONSENT, PRINT_BALLOTS } = CONFIG

const INITIAL_STATE = {
    activeStudent: {},
    ballotNumber: '',
    isOpen: false,
    helpText: '',
    searchQuery: '',
    students: [],
    showRegistrationComplete: false,
    showCompleteSession: false,
    showConsentDialog: false,
    token: null,
}

function parseStudent(student) {
    let data = {
        name: student.full_name,
        token: student.token,
        hasVoted: student.has_voted,
        data: student.data,
    }
    return data
}

function buildFoundStudentsNote(numOfStudents, query) {
    return (
        <>
            {numOfStudents > 1 ? 'Select' : 'Check the information and select'}{' '}
            the voter
            <br />
            The query <strong>{query}</strong> returned {numOfStudents} voter
            {numOfStudents > 1 && 's'}
        </>
    )
}

export default store => {
    store.on('@init', () => ({ session: INITIAL_STATE }))

    store.on('session/start', ({ session }) => {
        console.log('Starting new session...')
        store.dispatch('appGlobal/loadingStart')
        API.regback
            .post('/start_new_session', {})
            .then(res => {
                if (res.data.error) return handleErrorCode(res.data.error.code)
                const token = res.data.data.check_in_session.token
                store.dispatch('session/started', token)
            })
            .catch(err => {
                handleApiError(err)
            })
            .finally(() => {
                store.dispatch('appGlobal/loadingEnd')
            })
    })

    store.on('session/started', ({ session }, token) => {
        return {
            session: {
                ...session,
                token,
                isOpen: true,
                helpText: 'Search for the voter',
            },
        }
    })

    store.on('session/searchByName', ({ session }, name) => {
        let data = {}
        data.check_in_session_token = session.token
        data.student = {}
        data.student.full_name = name

        console.log('Searching student by name...')

        store.dispatch('appGlobal/loadingStart')

        API.regback
            .post('/search_by_name', data)
            .then(res => {
                if (res.data.error) return handleErrorCode(res.data.error.code)

                const foundStudents = res.data.data.students
                let students = foundStudents.map(student => {
                    return parseStudent(student)
                })

                store.dispatch('session/searchByNameSuccess', {
                    students,
                    searchQuery: name,
                })
            })
            .catch(err => {
                handleApiError(err)
            })
            .finally(() => {
                store.dispatch('appGlobal/loadingEnd')
            })
    })

    store.on(
        'session/searchByNameSuccess',
        ({ session }, { students, searchQuery }) => {
            return {
                session: {
                    ...session,
                    students: students,
                    searchQuery: searchQuery,
                    helpText: buildFoundStudentsNote(
                        students.length,
                        searchQuery
                    ),
                },
            }
        }
    )

    store.on('session/selectStudent', ({ session }, student) => {
        return {
            session: {
                ...session,
                activeStudent: student,
                helpText: '',
                showConsentDialog: ASK_CONSENT,
            },
        }
    })

    store.on('session/unselectStudent', ({ session }) => {
        console.log('Unselecting student...')
        return {
            session: {
                ...session,
                activeStudent: {},
                helpText: buildFoundStudentsNote(
                    session.students.length,
                    session.searchQuery
                ),
            },
        }
    })

    store.on('session/backToSearch', ({ session }) => {
        console.log('Going back to Search...')
        return {
            session: {
                ...session,
                students: [],
                helpText: 'Search for the voter',
            },
        }
    })

    store.on('session/confirmConsent', ({ session }) => {
        console.log('Confirming consent...')
        return {
            session: {
                ...session,
                showConsentDialog: false,
            },
        }
    })

    store.on('session/cancelConsent', ({ session }) => {
        console.log('Cancelling consent...')
        return {
            session: {
                ...session,
                activeStudent: {},
                helpText: buildFoundStudentsNote(
                    session.students.length,
                    session.searchQuery
                ),
                showConsentDialog: false,
            },
        }
    })

    store.on('session/detectedNumber', ({ session }, number) => {
        let activeStudent = { ...session.activeStudent }
        activeStudent.docNumber = number
        activeStudent.docType = 0
        return {
            session: {
                ...session,
                activeStudent,
            },
        }
    })

    store.on('session/issueBallot', ({ session }, student) => {
        let data = {}
        data.check_in_session_token = session.token
        data.do_revoke_ballot = student.hasVoted
        data.student = {}
        data.student.token = student.token
        data.student.doc_type = student.docType
        data.student.doc_num = student.docNumber

        store.dispatch('appGlobal/loadingStart')

        console.log(`Submitting student with doctype ${data.student.doc_type}`)

        return API.regback
            .post('/issue_ballot', data)
            .then(res => {
                let ballot
                if (res.data.error) {
                    const ignore = shouldIgnoreRegError(res.data.error)
                    if (!ignore) return handleErrorCode(res.data.error.code)
                    ballot = res.data.error.context.ballot
                }
                if (!ballot) ballot = res.data.data.ballot

                let ballotNumber = PRINT_BALLOTS ? ballot.uuid : ballot.number
                store.dispatch('session/issueBallotSuccess', ballotNumber)
            })
            .catch(err => {
                handleApiError(err)
            })
            .finally(() => {
                store.dispatch('appGlobal/loadingEnd')
            })
    })

    store.on('session/issueBallotSuccess', (_, ballotNumber) => {
        if (PRINT_BALLOTS) {
            store.dispatch('printer/print', { number: ballotNumber })
        } else {
            store.dispatch('session/issueBallotEnd', ballotNumber)
        }
    })

    store.on('session/complete', ({ session }, config) => {
        config.check_in_session_token = session.token

        API.regback
            .post('/complete_session', config)
            .then(res => {
                // 508 - already closed
                if (res.data.error && res.data.error.code !== 508)
                    return handleErrorCode(res.data.error.code)
                store.dispatch('session/completeSuccess')
            })
            .catch(err => {
                handleApiError(err)
            })
            .finally(() => {
                store.dispatch('appGlobal/loadingEnd')
            })
    })

    store.on('session/completeSuccess', ({ session }) => {
        return {
            session: {
                ...session,
                showRegistrationComplete: false,
                showCompleteSession: true, // show if no printererror
            },
        }
    })

    store.on('session/issueBallotEnd', ({ session }, ballotNumber) => {
        return {
            session: {
                ...session,
                showRegistrationComplete: true,
                ballotNumber,
            },
        }
    })

    store.on('session/cancel', ({ session }) => {
        const token = { check_in_session_token: session.token }

        console.log('Canceling session...')
        store.dispatch('appGlobal/loadingStart')
        API.regback
            .post('/cancel_session', token)
            .then(res => {
                if (res.data.error)
                    handleErrorCode(res.data.error.code, { silent: true })
                store.dispatch('session/end')
            })
            .catch(err => {
                handleApiError(err)
            })
            .finally(() => {
                store.dispatch('appGlobal/loadingEnd')
            })
    })

    store.on('session/closeAll', ({ session }) => {
        API.regback.post('/close_sessions', {}).catch(err => {
            console.warn(err)
        })
    })

    store.on('session/end', () => {
        return { session: INITIAL_STATE }
    })
}
