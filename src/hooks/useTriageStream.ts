"use client";

import { useEffect, useRef } from "react";
import { useRequestStore } from "./useRequestStore";
import type { SSEEvent } from "@/lib/streaming/events";

export function useTriageStream(requestId: string, autoStart = false) {
  const handleEvent = useRequestStore((s) => s.handleEvent);
  const reset = useRequestStore((s) => s.reset);
  const isStreaming = useRequestStore((s) => s.isStreaming);
  const eventSourceRef = useRef<EventSource | null>(null);

  function startStream() {
    if (eventSourceRef.current) return;

    // Use fetch + ReadableStream instead of EventSource (for POST)
    fetch(`/api/triage/${requestId}`, { method: "POST" })
      .then((res) => {
        if (!res.ok || !res.body) {
          handleEvent({
            type: "error",
            message: `Failed to start triage: ${res.statusText}`,
            recoverable: false,
          });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        function pump() {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) return;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const event = JSON.parse(
                      line.slice(6)
                    ) as SSEEvent;
                    handleEvent(event);
                  } catch {
                    // ignore parse errors
                  }
                }
              }

              pump();
            })
            .catch((err: unknown) => {
              handleEvent({
                type: "error",
                message:
                  err instanceof Error
                    ? err.message
                    : "Stream connection error",
                recoverable: false,
              });
            });
        }

        pump();
      })
      .catch((err: unknown) => {
        handleEvent({
          type: "error",
          message:
            err instanceof Error ? err.message : "Failed to connect to stream",
          recoverable: false,
        });
      });
  }

  useEffect(() => {
    if (autoStart) {
      reset();
      startStream();
    }
    return () => {
      eventSourceRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, autoStart]);

  return { startStream, isStreaming };
}
