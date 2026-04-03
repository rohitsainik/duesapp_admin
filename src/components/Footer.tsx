import React from "react";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-white border-t shadow-sm px-6 py-3 text-sm text-gray-600 text-center z-50">
      <div>
        © {new Date().getFullYear()}{" "}
        <span className="font-semibold text-indigo-600">duesbook</span>. All
        rights reserved.
      </div>
      <div className="mt-1 space-x-4 text-xs text-gray-500">
        <a href="/privacy" className="hover:text-indigo-600 transition-colors">
          Privacy
        </a>
        <a href="/settings" className="hover:text-indigo-600 transition-colors">
          Terms
        </a>
        <a href="/support" className="hover:text-indigo-600 transition-colors">
          Support
        </a>
      </div>
    </footer>
  );
}
