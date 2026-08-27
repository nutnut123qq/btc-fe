"use client";

import { useEffect } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Handler]:", error);
  }, [error]);

  return (
    <html lang="vi" className="h-full bg-gray-950 text-gray-100">
      <body className="min-h-full flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border border-rose-500/30 rounded-2xl p-8 text-center shadow-2xl">
          <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 text-rose-400 mb-4 ring-1 ring-rose-500/20">
            <AlertOctagon className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">Lỗi hệ thống nghiêm trọng</h2>
          <p className="text-sm text-gray-400 mb-6">
            Giao diện gốc gặp sự cố và không thể tiếp tục kết xuất.
          </p>
          {error.message && (
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-rose-300 font-mono text-left mb-6 overflow-x-auto max-h-32">
              {error.message}
            </div>
          )}
          <button
            onClick={reset}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white rounded-xl transition-all shadow-lg shadow-teal-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            Khởi động lại ứng dụng
          </button>
        </div>
      </body>
    </html>
  );
}
