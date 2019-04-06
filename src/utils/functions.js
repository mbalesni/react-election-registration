const MAX_SCREEN_WIDTH = 640

export function isMobileScreen() {
    return window.innerWidth <= MAX_SCREEN_WIDTH
}