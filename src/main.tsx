import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './theme/ThemeProvider';
import { MotionProvider } from './motion/MotionProvider';
import './index.css';
import './motion/motion.css';
import './layout.css';
import './theme/themes.css';
import './components/experiments.css';
import './motion/ambient.css';
import './components/onboarding.css';
import './components/careers.css';
import './components/multiCollege.css';
import './components/chartFocus.css';
import './components/quickEstimate.css';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <MotionProvider>
        <App />
      </MotionProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
