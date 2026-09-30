import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/variables.css'
import './styles/theme-pro.css'
import './index.css'
import './components/components.css'
import './screens/screens.css'
import App from './App.tsx'
import { isThemeOn, loadProState } from './pro/storage'
import { applyTheme } from './pro/theme'

applyTheme(isThemeOn(loadProState()))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
