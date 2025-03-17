// Import our new UnifiedActivity page
import UnifiedActivityPage from './pages/UnifiedActivity';

// Add the new route for the unified timeline
{
  path: "/activity",
  element: (
    <ProtectedRoute>
      <Navbar />
      <UnifiedActivityPage />
    </ProtectedRoute>
  ),
}, 