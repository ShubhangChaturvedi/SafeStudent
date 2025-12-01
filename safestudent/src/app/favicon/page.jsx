"use client";
import React from "react";

function MainComponent() {
  const { useEffect } = React;

  useEffect(() => {
    const faviconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" fill="url(#shieldGrad)"/>
        <path d="M16 4L8 8v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V8l-8-4z" fill="white"/>
        <path d="M16 6L10 9v5c0 3.8 2.7 7.3 6 8.3 3.3-1 6-4.5 6-8.3V9l-6-3z" fill="url(#shieldGrad)"/>
      </svg>
    `;

    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = "data:image/svg+xml;base64," + btoa(faviconSvg);

    const existingFavicon = document.querySelector('link[rel="icon"]');
    if (existingFavicon) {
      document.head.removeChild(existingFavicon);
    }
    document.head.appendChild(link);

    const appleLink = document.createElement("link");
    appleLink.rel = "apple-touch-icon";
    appleLink.href = "data:image/svg+xml;base64," + btoa(faviconSvg);
    document.head.appendChild(appleLink);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-32 h-32 mx-auto mb-8 relative">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
            <i className="fas fa-shield-alt text-white text-6xl"></i>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4 font-inter">
          SafeStudent Favicon
        </h1>

        <p className="text-gray-400 mb-6 leading-relaxed">
          The SafeStudent shield icon has been set as your browser favicon. This
          simple blue gradient shield represents safety and protection for
          students.
        </p>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 mb-6">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
            <i className="fas fa-check-circle text-green-500"></i>
            <span>Shield favicon successfully loaded</span>
          </div>
        </div>

        <a
          href="/"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          <i className="fas fa-home"></i>
          <span>Return to SafeStudent</span>
        </a>
      </div>
    </div>
  );
}

export default MainComponent;