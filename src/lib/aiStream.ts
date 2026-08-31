export type AiSseEvent =
  | { type: "token"; token: string }
  | { type: "done"; evidenceTags: string[] };

export function parseAiSseLine(line: string): AiSseEvent | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith(":")) return null;
  if (!trimmed.startsWith("data:")) throw new Error("AI_STREAM_INVALID_EVENT");

  const json = trimmed.slice(5).trim();
  if (!json) throw new Error("AI_STREAM_INVALID_EVENT");

  let payload: unknown;
  try {
    payload = JSON.parse(json);
  } catch {
    throw new Error("AI_STREAM_INVALID_JSON");
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("AI_STREAM_INVALID_EVENT");
  }

  const record = payload as Record<string, unknown>;
  if (record.error || record.code) throw new Error("AI_STREAM_ERROR");

  if (record.done === true) {
    const rawTags = record.evidence_tags ?? record.evidenceTags;
    const evidenceTags = Array.isArray(rawTags)
      ? rawTags.filter((tag): tag is string => typeof tag === "string")
      : [];
    return { type: "done", evidenceTags };
  }

  if (typeof record.token === "string") {
    return { type: "token", token: record.token };
  }

  throw new Error("AI_STREAM_INVALID_EVENT");
}

export function parseAiSseTranscript(transcript: string): AiSseEvent[] {
  const events: AiSseEvent[] = [];
  let done = false;

  for (const line of transcript.split(/\r?\n/)) {
    const event = parseAiSseLine(line);
    if (!event) continue;
    if (done) throw new Error("AI_STREAM_EVENT_AFTER_DONE");
    events.push(event);
    done = event.type === "done";
  }

  if (!done) throw new Error("AI_STREAM_TRUNCATED");
  return events;
}
