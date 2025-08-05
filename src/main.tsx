
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/branding.css";

// Debug React availability at the entry point
console.log('🔍 Main.tsx - React availability check:', {
  StrictMode: typeof StrictMode !== 'undefined' ? 'Available' : 'Not available',
  createRoot: typeof createRoot !== 'undefined' ? 'Available' : 'Not available'
});

const rootElement = document.getElementById("root");
console.log('🔍 Root element found:', !!rootElement);

if (!rootElement) {
  throw new Error("Root element not found");
}

try {
  const root = createRoot(rootElement);
  console.log('🔍 Root created successfully:', !!root);
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ Error rendering app:', error);
  throw error;
}
