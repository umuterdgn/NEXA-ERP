export * from "./locationTask";
export * from "./backgroundLocationTask";

import { registerLocationTask } from "./locationTask";
import { registerBackgroundLocationTask } from "./backgroundLocationTask";

export function initializeBackgroundTasks() {
  registerLocationTask();
  registerBackgroundLocationTask();
}
