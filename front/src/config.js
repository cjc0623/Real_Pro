// 프로젝트 전역 설정 단일 소스.
// 기존에 30여 개 파일이 제각각 정의하던 API_BASE 를 이 한 곳으로 통합.
export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';
