import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');

if (!container) {
    throw new Error('Nu am găsit elementul root în HTML');
}

createRoot(container).render(
    <StrictMode>
        <App />
    </StrictMode>
);