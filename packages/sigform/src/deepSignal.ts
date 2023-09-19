import { isObject } from "./util";
import { Signal, signal as asSignal } from "@preact/signals-react";
import { enablePatches, produceWithPatches, setAutoFreeze } from "immer";
import { Draft, PatchListener, Producer } from "immer/src/types/types-external";
import { useMemo } from "react";
import invariant from "tiny-invariant";

enablePatches();
setAutoFreeze(false);

const META = "__meta";
const IS_PROXY = "__proxy";

export const isProxy = (v: any) => v && v[IS_PROXY];

export const useDeepSignal = <T extends object>(value: T): Signal<T> => {
  return useMemo(() => deepSignal(value), []);
};

type Meta<T extends object, P> = {
  value: T;
  parent?: P;
  fieldName?: string;
  onChange: (next: T) => void;
};

// Attach metadata to value.
const attachMeta = <T extends object, P>(value: T, meta: Meta<T, P>): T => {
  if (!isObject(value)) return value;
  Object.defineProperty(value, META, {
    value: meta,
    writable: true,
    enumerable: false,
  });
  return value;
};

export const meta = (value: any): any => {
  if (value[META]) {
    return value[META];
  }
  return null;
};

export const parent = (value: any): any => {
  if (meta(value)) {
    return meta(value).parent;
  }
  return null;
};

// Find root node by go-up 'parent' meta.
export const root = (value: any): any => {
  const up = (value: any): any => {
    if (parent(value)) {
      return up(parent(value));
    } else {
      return value;
    }
  };
  return up(value);
};

// Wrap value by proxy for decorate "parent" on each field getter access.
const wrapParent = <T extends object, P>(value: T, meta: Meta<T, P>): T => {
  const asProxy = (self: any): T =>
    new Proxy(self, {
      get(target: any, p: string | symbol, receiver: any) {
        // Expose isProxy for detect Proxy or not from outside.
        if (p === IS_PROXY) {
          return true;
        }
        const value = Reflect.get(target, p, receiver);

        // Skip reserved properties.
        const shouldIgnore = ["prototype", META].includes(p as string);
        if (shouldIgnore || p === META || !isObject(value)) {
          return value;
        }

        return asProxy(
          attachMeta(value, {
            value,
            parent: self,
            fieldName: p as string,
            onChange: meta.onChange,
          }),
        );
      },
    }) as T;
  return asProxy(attachMeta(value, meta));
};

// Mutate signal value using "immer" style callback.
export const mutate = <Base, D = Draft<Base>>(
  base: Base,
  recipe: Producer<D>,
  listener?: PatchListener,
) => {
  // Get meta from "base"
  const m = meta(base);
  const r = root(base);

  invariant(
    m,
    "Metadata not found, you must use 'mutate()' for mutate deepSignal.",
  );

  invariant(
    r,
    "Root not found, It's likely 'sigform' bug, Please submit GH issue with details.",
  );

  const [next, patches] = produceWithPatches(m.value, recipe as any, listener);

  if (patches.length > 0 && m) {
    if (m.parent) {
      // Apply change to parent.
      m.parent[m.fieldName] = next;
      // Propagate changes to root.
      const rootMeta = meta(r);
      invariant(
        rootMeta,
        "Root metadata not found, It's likely 'sigform' bug, Please submit GH issue with details.",
      );
      rootMeta.onChange(r);
    } else {
      // Pass direct change to onChange.
      m.onChange(next);
    }
  }
};

export const deepSignal = <T extends object>(
  value: T | undefined | null,
): Signal<T> => {
  let signal = asSignal(value);

  // Wrap by proxy if object(& array).
  if (isObject(value)) {
    const m = meta(value) || {};
    const onChange = (next: T) => {
      // Propagate nested changes to 'signal'.
      signal.value = wrapParent(next, { ...m, value: next, onChange });
    };

    signal.value = wrapParent(signal.value as T, {
      ...m,
      value: signal.value as T,
      onChange: (next: T) => {
        // Propagate nested changes to 'signal'.
        signal.value = next;
      },
    });

    signal = new Proxy(signal, {
      set(
        target: Signal<T>,
        p: string | symbol,
        newValue: any,
        receiver: any,
      ): boolean {
        if (p.toString() === "value") {
          // Always wrap new "value" by proxy.
          newValue = wrapParent(newValue, { ...m, value: newValue, onChange });
        }
        return Reflect.set(target, p, newValue, receiver);
      },
    });
  }

  return signal as Signal<T>;
};
