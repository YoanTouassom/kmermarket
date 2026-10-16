import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import Toaster from '../ui/Toaster'

/** Layout public : navbar + contenu + footer + notifications. */
export default function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}