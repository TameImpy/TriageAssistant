import { formatSSEEvent, type SSEEvent } from "./events";

export function createSSEStream(
  generator: AsyncGenerator<SSEEvent>
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of generator) {
          controller.enqueue(encoder.encode(formatSSEEvent(event)));
        }
      } catch (err) {
        const errorEvent: SSEEvent = {
          type: "error",
          message: err instanceof Error ? err.message : "Unknown error",
          recoverable: false,
        };
        controller.enqueue(encoder.encode(formatSSEEvent(errorEvent)));
      } finally {
        controller.close();
      }
    },
  });
}

export function sseHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}
