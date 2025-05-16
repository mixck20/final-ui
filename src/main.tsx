import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Feed from './Feed'  // import Feed component

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Feed />  {/* Render the Feed component */}
  </StrictMode>
)
