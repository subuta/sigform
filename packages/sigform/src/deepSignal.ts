import * as iarray from "@immutable-array/prototype";
import { Signal, batch, signal } from "@preact/signals-react";
import { useMemo } from "react";
import invariant from "tiny-invariant";

// SEE: [You Might Not Need Lodash](https://youmightnotneed.com/lodash#isObject)
const isObject = (a: any) => a instanceof Object;

// SEE: [dy/signal-struct: Combined signal storage](https://github.com/dy/signal-struct/blob/main/signal-struct.js#L6)
export const isSignal = (v: any) => v && !!v.peek;

// SEE: [You Might Not Need Lodash](https://youmightnotneed.com/lodash#omit)
const omit = (obj: any, props: string[]) => {
  obj = { ...obj };
  props.forEach((prop) => delete obj[prop]);
  return obj;
};

export const setDeepSignal = (obj: Signal<any>, path: string, value: any) => {
  // Get deeply nested signal
  const signal = getDeepSignal(obj, path);
  if (!signal) {
    return false;
  }
  // Update value of signal.
  signal.value = value;
  return true;
};

// SEE: [You Might Not Need Lodash](https://youmightnotneed.com/lodash#get)
export const getDeepSignal = (
  obj: Signal<any>,
  path: string,
): DeepSignal<any> | undefined => {
  // If path is not defined or it has false value
  if (!path) return undefined;
  // Check if path is string or array. Regex : ensure that we do not have '.' and brackets.
  // Regex explained: https://regexr.com/58j0k
  const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);
  invariant(pathArray, "must exists");

  // Find value or return undefined
  // @ts-ignore
  return pathArray.reduce((prevObj, key, i) => {
    if (i === pathArray.length - 1) return prevObj[key];
    if (prevObj && prevObj[key]) {
      return prevObj[key].value;
    }
  }, obj.value);
};

export const deepSignalToJSON = (data: Signal<any>): any => {
  if (!isSignal(data)) return data;

  if (Array.isArray(data.value)) {
    return data.value.map((v) => deepSignalToJSON(v));
  } else if (isObject(data.value)) {
    const obj = data.value as Record<string, any>;
    return Object.keys(obj).reduce(
      (acc, k) => {
        acc[k] = deepSignalToJSON(obj[k]);
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  return deepSignalToJSON(data.value);
};

export type DeepSignal<T> = Signal<T> & {
  dump: () => T;
};

export type DeepObjectSignal<T> = Signal<T> & {
  dump: () => T;
  set: (key: string, value: any) => void;
  assign: (obj: Record<string, any>) => void;
  delete: (...keys: string[]) => void;
  remove: (predicate: (value: any, key: string) => boolean) => void;
};

// Uses '@immutable-array/prototype' for array operation.
// SEE: [azu/immutable-array-prototype: A collection of Immutable Array prototype methods(Per method packages).](https://github.com/azu/immutable-array-prototype)
export type DeepArraySignal<T> = Signal<T> & {
  dump: () => T[];
  // Removes the last element from an array and returns it.
  pop(): T[];
  // Appends new elements to an array, and returns the new length of the array.
  push(...items: T[]): Array<T>;
  // Removes the first element from an array and returns it.
  shift(): Array<T>;
  // Inserts new elements at the start of an array.
  unshift(...items: T[]): T[];
  //  Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
  splice(start?: number, deleteCount?: number, ...items: T[]): Array<T>;
  splice(...args: any[]): Array<T>;
  // Reverses the elements in an Array.
  reverse(): Array<T>;
  // Sorts an array.
  sort(compareFn?: (a: T, b: T) => number): Array<T>;
  // Returns this object after filling the section identified by start and end with value
  fill(value: T, start?: number, end?: number): Array<T>;
  // Returns this object after copying a section of the array identified by start and end to the same array starting at position target
  copyWithin<T>(target: number, start: number, end?: number): Array<T>;
};

const asDeepSignal = <T>(data: T): DeepSignal<T> => {
  const s = signal(data) as DeepSignal<any>;
  s.dump = () => deepSignalToJSON(s);
  return s;
};

const asDeepObjectSignal = <T>(data: T): DeepObjectSignal<T> => {
  const s = signal(data) as DeepObjectSignal<any>;
  const set = (key: string, value: any) => {
    batch(() => {
      // Add key to parent at first.
      s.value = { [key]: deepSignal(value), ...s.value };
      // Then update nested value.
      s.value[key].value = value;
    });
  };
  s.dump = () => deepSignalToJSON(s);
  s.set = set;
  s.delete = (...keys) => {
    s.value = omit(s.value, keys);
  };
  s.assign = (obj) => {
    // Update in batch.
    batch(() => {
      Object.keys(obj).forEach((key) => {
        set(key, obj[key]);
      });
    });
  };
  s.remove = (predicate) => {
    const obj = s.dump();
    const keys = Object.keys(obj).filter((key) => {
      const value = obj[key];
      return predicate(value, key);
    });
    s.value = omit(s.value, keys);
  };
  return s;
};

const asDeepArraySignal = <T>(data: T[]): DeepArraySignal<T> => {
  const s = signal(data) as DeepArraySignal<any>;
  s.dump = () => deepSignalToJSON(s);
  s.pop = () => {
    s.value = iarray.pop(s.value);
    return s.value;
  };
  s.push = (...items) => {
    s.value = iarray.push(s.value, ...items.map(deepSignal));
    return s.value;
  };
  s.shift = () => {
    s.value = iarray.shift(s.value);
    return s.value;
  };
  s.unshift = (...items) => {
    s.value = iarray.unshift(s.value, ...items.map(deepSignal));
    return s.value;
  };
  s.splice = (start, deleteCount, ...items) => {
    s.value = iarray.splice(
      s.value,
      start,
      deleteCount,
      ...items.map(deepSignal),
    );
    return s.value;
  };
  s.sort = (compareFn) => {
    s.value = iarray.sort(s.value, compareFn);
    return s.value;
  };
  s.reverse = () => {
    s.value = iarray.reverse(s.value);
    return s.value;
  };
  s.fill = (value, start, end) => {
    s.value = iarray.fill(s.value, deepSignal(value), start, end);
    return s.value;
  };
  s.copyWithin = (target, start, end) => {
    s.value = iarray.copyWithin(s.value, target, start, end);
    return s.value;
  };
  return s;
};

// Create signal recursively.
export function deepSignal(data: any[]): DeepArraySignal<any>;
export function deepSignal(data: Record<any, any>): DeepObjectSignal<any>;
export function deepSignal(data: any): DeepSignal<any>;
export function deepSignal(
  data: any | Record<any, any> | any[],
): DeepSignal<any> | DeepObjectSignal<any> | DeepArraySignal<any> {
  if (Array.isArray(data)) {
    return asDeepArraySignal(data.map((v) => deepSignal(v)));
  } else if (isObject(data)) {
    const obj = data as Record<string, any>;
    return asDeepObjectSignal(
      Object.keys(obj).reduce(
        (acc, k) => {
          acc[k] = deepSignal(obj[k]);
          return acc;
        },
        {} as Record<string, any>,
      ),
    );
  } else if (isSignal(data)) {
    // Pass-through if "signal" instance passed.
    return data;
  }
  return asDeepSignal(data);
}

// deep version of "useSignal"
export const useDeepSignal = <T>(data: Record<string, any>): DeepSignal<T> => {
  return useMemo(() => deepSignal(data), []);
};
