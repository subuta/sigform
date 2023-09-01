import { Signal, signal } from "@preact/signals-react";
import { useMemo } from "react";
import invariant from "tiny-invariant";

// SEE: [You Might Not Need Lodash](https://youmightnotneed.com/lodash#isObject)
const isObject = (a: any) => a instanceof Object;

// SEE: [dy/signal-struct: Combined signal storage](https://github.com/dy/signal-struct/blob/main/signal-struct.js#L6)
export const isSignal = (v: any) => v && !!v.peek;

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
): Signal<any> | undefined => {
  // If path is not defined or it has false value
  if (!path) return undefined;
  // Check if path is string or array. Regex : ensure that we do not have '.' and brackets.
  // Regex explained: https://regexr.com/58j0k
  const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);
  invariant(pathArray, "must exists");

  // Find value or return undefined
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
  toJSON: () => T;
};

const asDeepSignal = <T>(data: any): DeepSignal<T> => {
  const s = signal(data) as DeepSignal<any>;
  s.toJSON = () => deepSignalToJSON(s);
  return s;
};

// Create signal recursively.
export const deepSignal = (data: any): DeepSignal<any> => {
  if (Array.isArray(data)) {
    return asDeepSignal(data.map((v) => deepSignal(v)));
  } else if (isObject(data)) {
    const obj = data as Record<string, any>;
    return asDeepSignal(
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
};

// deep version of "useSignal"
export const useDeepSignal = <T>(data: Record<string, any>): Signal<T> => {
  return useMemo(() => deepSignal(data), []);
};
