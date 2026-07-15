import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './api/axiosSetup'; // 전역 axios JWT 인터셉터 등록 (앱 시작 시 1회)
import App from './App';
import reportWebVitals from './reportWebVitals';
import { purgeExpiredTokens } from './utils/jwtUtils';

// Redux 관련 import 추가
import { Provider } from 'react-redux';
import store from './store/store';  // store 경로 맞게 조정

// 렌더 전에 만료된 세션을 정리 → 새로고침 시 로그인 상태로 잘못 표시되는 문제 방지
purgeExpiredTokens();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  // </React.StrictMode>
);

reportWebVitals();