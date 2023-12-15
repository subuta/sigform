import { Patch, produceWithPatches } from "immer";
import { Producer } from "immer/src/types/types-external";

export const wrapPatches = (patches: Patch[], name: string | number | null) => {
  // Skip wrap if no explicit name passed.
  if (name === null) return;
  patches.forEach((patch) => {
    patch.path.unshift(name);
  });
};

export const mutate = <T>(
  state: any,
  recipe: Producer<T>,
  name: string | number | null = null,
): [T, Patch[]] => {
  const [nextState, patches] = produceWithPatches(state, recipe) as any;

  if (name !== null) {
    wrapPatches(patches, name);
  }

  return [nextState, patches];
};
