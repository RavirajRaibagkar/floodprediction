import Dashboard from './pages/Dashboard'
import { RegionProvider } from './context/RegionContext'
import { ShelterProvider } from './context/ShelterContext'

function App() {
  return (
    <RegionProvider>
      <ShelterProvider>
        <Dashboard />
      </ShelterProvider>
    </RegionProvider>
  )
}

export default App
