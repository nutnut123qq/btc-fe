"use client";

import { useState } from "react";
import { getSessionKey, setSessionKey, type SessionKeyKind } from "@/lib/sessionAuth";

export function SessionAccessPanel({
  kind,
  label,
  onChange,
}: {
  kind: SessionKeyKind;
  label: string;
  onChange?: (unlocked: boolean) => void;
}) {
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(() => Boolean(getSessionKey(kind)));

  const update = (value: string) => {
    setSessionKey(kind, value);
    const next = Boolean(value.trim());
    setUnlocked(next);
    setKey("");
    onChange?.(next);
  };

  return (
    <div className="rounded border border-slate-800 bg-slate-900 px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-200">
            {unlocked && <span className="h-1.5 w-1.5 rounded-full bg-teal-500" aria-hidden="true" />}
            {label}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {unlocked
              ? "Đã mở khóa trong tab hiện tại. Khóa không được ghi vào bundle hoặc localStorage."
              : "Các thao tác ghi dữ liệu đang bị khóa. Nhập khóa phiên để mở."}
          </div>
        </div>
        {!unlocked ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              update(key);
            }}
          >
            <label className="sr-only" htmlFor={`${kind}-session-key`}>{label}</label>
            <input
              id={`${kind}-session-key`}
              type="password"
              autoComplete="off"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="Khóa phiên"
              className="h-10 w-full rounded border border-slate-800 bg-slate-950 px-3 font-mono text-xs text-slate-200 transition-colors focus:border-teal-500 focus:outline-none sm:w-44"
            />
            <button
              type="submit"
              disabled={!key.trim()}
              className="h-10 shrink-0 rounded border border-teal-700/60 bg-teal-950/40 px-4 text-xs font-semibold text-teal-300 transition-colors hover:bg-teal-950/70 disabled:opacity-40"
            >
              Mở khóa
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => update("")}
            className="h-10 shrink-0 rounded border border-slate-700 px-4 text-xs text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200"
          >
            Khóa lại
          </button>
        )}
      </div>
    </div>
  );
}
