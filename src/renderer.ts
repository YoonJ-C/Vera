import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './renderer/App';
import './index.css';

let rootElement = document.getElementById('root');
if (!rootElement) {
  rootElement = document.createElement('div');
  rootElement.id = 'root';
  document.body.appendChild(rootElement);
}

const root = createRoot(rootElement);
root.render(React.createElement(App));
