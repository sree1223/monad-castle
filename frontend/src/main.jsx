import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import IntroPage from './onboarding/IntroPage.jsx'
import IntroPage2 from './onboarding/IntroPage2.jsx'
import UserPage from './pages/UserPage.jsx'
import DepositWithdrawPage from './pages/DepositWithdrawPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import { MonadProvider } from './context/MonadContext.jsx'
import { PrivyWrapper } from './context/PrivyWrapper.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PrivyWrapper>
        <MonadProvider>
          <Routes>
            <Route path="/"         element={<App />} />
            <Route path="/intro"    element={<IntroPage />} />
            <Route path="/intro2"   element={<IntroPage2 />} />
            <Route path="/profile"  element={<UserPage />} />
            <Route path="/wallet"   element={<DepositWithdrawPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </MonadProvider>
      </PrivyWrapper>
    </BrowserRouter>
  </StrictMode>,
)

