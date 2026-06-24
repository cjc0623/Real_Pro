export const tokenStore = {
    get access() { return sessionStorage.getItem('accessToken'); },
    get refresh() { return sessionStorage.getItem('refreshToken'); },

    save({ accessToken, refreshToken }) {
        // 토큰은 sessionStorage 에만 보관 (탭/브라우저 종료 시 자동 삭제)
        sessionStorage.setItem('accessToken', accessToken);
        sessionStorage.setItem('refreshToken', refreshToken);
    },

    clear() {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
    }
};