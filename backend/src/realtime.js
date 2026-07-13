// Thin wrapper around the Socket.IO server so controllers can emit change
// notifications without importing the server directly. `io` is set during
// startup; when it's unset (e.g. under tests) the emit helpers are no-ops.

let io = null;

export function setIO(instance) {
  io = instance;
}

/** Notify all clients that a specific project's data changed. */
export function emitProjectUpdate(project) {
  if (io && project) {
    io.emit('project:updated', { project });
  }
}

/** Notify all clients that the project list changed (created/deleted). */
export function emitProjectsUpdate() {
  if (io) {
    io.emit('projects:updated');
  }
}
