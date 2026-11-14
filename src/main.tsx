import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {installExtensionErrorGuard} from './utils/extensionErrorGuard';

installExtensionErrorGuard();

createRoot(document.getElementById('root')!).render(<App />);
