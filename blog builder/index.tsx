import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const GlobalStyles = () => (
  <style>{`
    body {
      font-family: 'Poppins', sans-serif;
    }
  `}</style>
);


const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GlobalStyles />
    <App />
  </React.StrictMode>
);