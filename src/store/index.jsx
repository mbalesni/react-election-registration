import createStore from 'storeon'

import auth from './auth'
import appGlobal from './appGlobal'
import session from './session'
import printer from './printer'

const store = createStore([
    auth,
    appGlobal,
    session,
    printer,
    process.env.NODE_ENV !== 'production' && require('storeon/devtools'),
])

export default store
