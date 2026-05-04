import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'
import { Capacitor } from '@capacitor/core'

// Initialize Capacitor
if (Capacitor.isNativePlatform()) {
    console.log('Running on native platform')
} else {
    console.log('Running on web platform')
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
