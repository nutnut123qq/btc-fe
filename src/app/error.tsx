"use client";

import { useEffect } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error Handler caught exception]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-8 text-center shadow-2xl">
        <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 text-rose-400 mb-4 ring-1 ring-rose-500/20">
          <AlertOctagon className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Đã xảy ra sự cố ứng dụng</h2>
        <p className="text-sm text-slate-400 mb-6">
          Một ngoại lệ không mong muốn đã xảy ra trong quá trình hiển thị giao diện.
        </p>
        {error.message && (
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-rose-300 font-mono text-left mb-6 overflow-x-auto max-h-32">
            {error.message}
          </div>
        )}
        <button
          onClick={reset}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl transition-all shadow-lg shadow-teal-500/20"
        >
          <RefreshCw className="w-4 h-4" />
          Tải lại giao diện
        </button>
      </div>
    </div>
  );
}
