export * from "./lodash";
export * from "./sigform";
export * from "./immer";

export const nextTick = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));
