import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

import { loadPlayer, settleOfflineReturn } from './data/player'

const root = document.getElementById('root')
if (!root) throw new Error('缺少根节点')

void loadPlayer()
  .then(() => settleOfflineReturn())
  .finally(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
