const INITIAL_STATE = {
    loading: false,
}

export default store => {
    store.on('@init', () => ({ appGlobal: INITIAL_STATE }));

    store.on('appGlobal/loadingStart', ({ appGlobal }) => {
        return { appGlobal: { ...appGlobal, loading: true }}
    })

    store.on('appGlobal/loadingEnd', ({ appGlobal }) => {
        return { appGlobal: { ...appGlobal, loading: false }}
    })
};