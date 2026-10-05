import { BrowserRouter, Route, Routes } from 'react-router-dom'
import BattlePreview from './pages/BattlePreview'
import BagPage from './pages/BagPage'
import CardDetailPage from './pages/CardDetailPage'
import CodexPage from './pages/CodexPage'
import DeckPage from './pages/DeckPage'
import GmPage from './pages/GmPage'
import HomePage from './pages/HomePage'
import RealmBattlePage from './pages/RealmBattlePage'
import RealmListPage from './pages/RealmListPage'
import { AppShell } from './ui/AppShell'

/**
 * 页面路由。默认进首页。原来的战斗预览留在 /battle。
 *
 * @returns 路由树
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="deck" element={<DeckPage />} />
          <Route path="bag" element={<BagPage />} />
          <Route path="gm" element={<GmPage />} />
          <Route path="codex" element={<CodexPage />} />
          <Route path="card/:place/:cardId" element={<CardDetailPage />} />
          <Route path="realm" element={<RealmListPage />} />
          <Route path="realm/:realmId" element={<RealmBattlePage />} />
        </Route>
        <Route path="battle" element={<BattlePreview />} />
      </Routes>
    </BrowserRouter>
  )
}
