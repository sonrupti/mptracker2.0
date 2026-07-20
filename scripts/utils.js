export const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function logSuccess(msg) {
  console.log("✅", msg);
}

export function logError(msg) {
  console.log("❌", msg);
}

export function logInfo(msg) {
  console.log("ℹ️", msg);
}