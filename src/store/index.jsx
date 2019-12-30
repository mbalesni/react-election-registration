import createStore from 'storeon'

import auth from './auth'
import appGlobal from './appGlobal'
import session from './session'
import printer from './printer'
import scanner from './scanner'

const store = createStore([
    auth,
    appGlobal,
    session,
    printer,
    scanner,
    process.env.NODE_ENV !== 'production' && require('storeon/devtools'),
])

export default store
