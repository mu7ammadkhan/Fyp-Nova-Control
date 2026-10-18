// These databases cannot commit atomically. Start both writes together and
// report partial failures accurately rather than claiming the switch succeeded.
export async function syncDeviceCommand(writeHardware, writeMetadata) {
  const [hardware, metadata] = await Promise.allSettled([
    Promise.resolve().then(writeHardware),
    Promise.resolve().then(writeMetadata),
  ]);
  if (hardware.status === "fulfilled" && metadata.status === "fulfilled") return;
  const error = new Error(
    hardware.status === "fulfilled"
      ? "Command sent, but dashboard sync failed. Retry to sync both."
      : metadata.status === "fulfilled"
        ? "Switch saved, but the hardware command failed. Please retry."
        : "The command could not be saved or sent. Please check your connection and retry.",
  );
  error.hardwareSaved = hardware.status === "fulfilled";
  error.metadataSaved = metadata.status === "fulfilled";
  throw error;
}

// A newer click always owns the UI, even when older responses arrive later.
export function createOptimisticSwitch(write) {
  const initial = { target: null, pending: false, error: "", retryState: null };
  let snapshot = initial;
  let version = 0;
  const listeners = new Set();
  const publish = (value) => {
    snapshot = value;
    listeners.forEach((listener) => listener());
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async set(value) {
      const state = !!value;
      const request = ++version;
      publish({ target: state, pending: true, error: "", retryState: null });
      try {
        await write(state);
        if (request === version) publish(initial);
      } catch (error) {
        if (request === version) publish({
          // Never visually undo a command that was successfully sent to hardware.
          target: error.hardwareSaved ? state : null,
          pending: false,
          error: error.message || "Unable to send this command. Please retry.",
          retryState: state,
        });
      }
    },
  };
}
