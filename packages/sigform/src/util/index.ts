import * as flat from "flat";

export * from "./lodash";
export * from "./sigform";
export * from "./immer";

// @ts-ignore
export const flatten = flat.default.flatten;
export const unflatten = flat.default.unflatten;
export const nextTick = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));
