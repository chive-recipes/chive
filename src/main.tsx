import { render } from 'preact'
import './index.css'
import { App } from './app.tsx'
import { AuthProvider } from './components/AuthProvider.tsx'

render(
  <AuthProvider>
    <App />
  </AuthProvider>,
  document.getElementById('app')!
)

