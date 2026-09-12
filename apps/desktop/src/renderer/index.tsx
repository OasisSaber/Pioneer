import { createRoot } from 'react-dom/client';

import { App } from './App';
import './styles/tokens.css';
import './styles/app.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Pioneer renderer root is missing.');
}

createRoot(rootElement).render(<App />);
