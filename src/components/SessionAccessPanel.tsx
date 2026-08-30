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
    <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-gray-300">{label}</div>
          <div className="text-[11px] text-gray-500">
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
              className="w-40 rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-xs text-gray-200"
            />
            <button
              type="submit"
              disabled={!key.trim()}
              className="rounded bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              Mở khóa
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => update("")}
            className="rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
          >
            Khóa lại
          </button>
        )}
      </div>
    </div>
  );
}
