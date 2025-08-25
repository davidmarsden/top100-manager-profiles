import React from "react";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 to-blue-200 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          ⚽ Top 100 Manager Profiles
        </h1>
        <p className="text-center text-gray-600">
          Celebrating 25 seasons of Soccer Manager Worlds
        </p>
      </header>

      <main className="flex flex-col items-center space-y-6">
        <a
          href="/request"
          className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg shadow-lg font-semibold"
        >
          ➕ Submit Your Profile
        </a>

        <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg font-semibold">
          🔍 Search Managers
        </button>
      </main>
    </div>
  );
}