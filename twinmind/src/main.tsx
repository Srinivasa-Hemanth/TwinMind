import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './authConfig'

const msalInstance = new PublicClientApplication(msalConfig)

const container = document.getElementById('root')

if (container) {
  msalInstance.initialize().then(() => {
    // Handle redirect promise for loginRedirect flow
    msalInstance.handleRedirectPromise().then((response) => {
      if (response && response.account) {
        msalInstance.setActiveAccount(response.account)
      } else {
        const currentAccounts = msalInstance.getAllAccounts()
        if (currentAccounts.length > 0) {
          msalInstance.setActiveAccount(currentAccounts[0])
        }
      }
    }).catch(err => {
      console.error('MSAL redirect error:', err)
    })

    const root = ReactDOM.createRoot(container)
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>,
    )
  })
}

