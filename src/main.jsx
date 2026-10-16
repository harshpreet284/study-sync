import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import { BookmarksProvider } from './context/BookmarksContext'
import { AuthProvider } from './context/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BookmarksProvider>
        <App />
      </BookmarksProvider>
    </AuthProvider>
  </React.StrictMode>,
)
