import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/app.css';
import App from './App';
import { startActivityBridge } from './career/bridge';

startActivityBridge();

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
