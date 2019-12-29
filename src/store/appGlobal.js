const INITIAL_STATE = {
    loading: false,
    isOnline: true,
}

export default store => {
    store.on('@init', () => ({ appGlobal: INITIAL_STATE }));

    store.on('appGlobal/loadingStart', ({ appGlobal }) => {
        return { appGlobal: { ...appGlobal, loading: true }}
    })

    store.on('appGlobal/loadingEnd', ({ appGlobal }) => {
        return { appGlobal: { ...appGlobal, loading: false }}
    })

    store.on('appGlobal/setOnline', ({ appGlobal }, isOnline) => {
        return { appGlobal: { ...appGlobal, isOnline }}
    })
};
