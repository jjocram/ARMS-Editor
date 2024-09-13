import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'

import 'rsuite/dist/rsuite.min.css';
import {CustomProvider} from "rsuite";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <CustomProvider theme={"light"}>
          <App />
      </CustomProvider>
  </StrictMode>,
)
