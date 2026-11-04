import React from 'react';
import AIChat from './AIChat';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Kuddy Cosmetics AI Hub
        </h1>
        <p className="text-sm text-gray-600">
          Your intelligent beauty advisor is ready. Click the chat button in the bottom right corner to start exploring custom skincare routines and product recommendations.
        </p>
      </div>

      {/* The Chat Widget Component */}
      <AIChat />
    </div>
  );
}

export default App;