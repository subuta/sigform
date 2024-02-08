import { set } from "./lodash";
import { Patch, produce, produceWithPatches } from "immer";
import { Producer } from "immer/src/types/types-external";

export const wrapPatches = (patches: Patch[], name: string | number | null) => {
  // Skip wrap if no explicit name passed.
  if (name === null) return;
  patches.forEach((patch) => {
    const chunks = String(name).split(".");
    patch.path = [...chunks, ...patch.path];
  });
};

// Wrap state in "__state" before processing as workaround for this error(eg: for Date)
// `Error: [Immer] produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got 'Date'`
// SEE: [Classes | Immer](https://immerjs.github.io/immer/complex-objects/)
const produceWithWrappedPatches = <T>(state: any, recipe: Producer<T>) => {
  const [wrappedResult, patches] = produceWithPatches(
    { __state: state },
    (draft) => recipe(draft.__state) as any,
  ) as any;

  const nextState = wrappedResult
    ? wrappedResult.__state || wrappedResult
    : wrappedResult;

  patches.forEach((patch: Patch) => {
    if (patch.path[0] === "__state") {
      patch.path.shift();
    }
  });

  return [nextState, patches];
};

export const mutate = <T>(state: any, recipe: Producer<T>): [T, Patch[]] => {
  const [nextState, patches] = produceWithWrappedPatches(state, recipe);
  return [nextState, patches];
};

// set values into obj accepts flatten "dot notation"(eg: "hoge.fuga") key.
export const mergeFlatten = (
  obj: Record<string, any>,
  flattenValues: Record<string, any>,
) =>
  produce(obj, (draft) => {
    const keys = Object.keys(flattenValues);
    keys.forEach((field) => {
      set(draft, field, flattenValues[field]);
    });
  });
