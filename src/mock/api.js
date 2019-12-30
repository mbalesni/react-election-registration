import MockAdapter from 'axios-mock-adapter'

const LAST_YEAR = (new Date().getFullYear() - 1).toString()
const NEXT_YEAR = (new Date().getFullYear() + 1).toString()
const DATETIME_ISO_STRING = new Date().toISOString()

function makeMockRegback(axiosInstance) {
    const mockRegback = new MockAdapter(axiosInstance, { delayResponse: 300 })

    mockRegback.onPost('/login').reply(200, {
        success: true
    })

    mockRegback.onPost('/me').reply(200, {
        data: {
            staff: {
                first_name: 'Rick',
                last_name: 'Sanchez',
                structural_unit_name: 'Universe C-137',
                vote_start_timestamp: LAST_YEAR + DATETIME_ISO_STRING.substring(4), // this time last year
                vote_end_timestamp: NEXT_YEAR + DATETIME_ISO_STRING.substring(4), // this time next year
            }
        }
    })

    mockRegback.onPost('/start_new_session').reply(200, {
        data: {
            check_in_session: {
                token: '144e8e3b-f4f3-40b6-9d37-b650e71e088b'
            }
        }
    })

    mockRegback.onPost('/search_by_name').reply(200, {
        data: {
            students: [
                {
                    full_name: 'Morty Smith',
                    token: '9110b886-d69e-4e6e-98ae-1468d5fb0144',
                    has_voted: false,
                    data: {
                        'Year': '8th Grade',
                        'Department': 'Science'
                    }
                },
                {
                    full_name: 'Summer Smith',
                    token: '587a31b5-bf80-4bb7-a4f7-13747c94c8dc',
                    has_voted: true,
                    data: {
                        'Year': '12th Grade',
                        'Department': 'Art'
                    }
                }
            ]
        }
    })


    mockRegback.onPost('/issue_ballot').reply(200, {
        data: {
            ballot: {
                uuid: 'e6e832cc-5c87-4ad3-9d05-e46bf6c7a289',
                number: '92-47-23-14',
            }
        }
    })

    mockRegback.onPost('/complete_session').reply(200, {
        success: true
    })

    mockRegback.onPost('/cancel_session').reply(200, {
        success: true
    })

    mockRegback.onPost('/close_sessions').reply(200, {
        success: true
    })

    mockRegback.onPost('/logout').reply(200, {
        success: true
    })
}

function makeMockPrinter(axiosInstance) {
    const mockPrinter = new MockAdapter(axiosInstance, { delayResponse: 300 })
    
    mockPrinter.onGet('/get_printers').reply(200, [
        ['Printer 1', '1'],
        ['Printer 2', '2'],
    ])

    mockPrinter.onPost('/print_ballot').reply(200, {
        success: true
    })
}

export {
    makeMockRegback,
    makeMockPrinter,
}

