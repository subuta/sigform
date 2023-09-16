import { clone, isObject } from "./util";
import { signal as asSignal } from "@preact/signals-core";
import { Signal } from "@preact/signals-react";
import { useMemo } from "react";
import isEqual from "react-fast-compare";

const noop = () => {};

export const useDeepSignal = <T>(value: T): Signal<T> => {
  return useMemo(() => deepSignal(value), []);
};

export const deepSignal = <T>(value: T): Signal<T> => {
  const watch = (value: any, onChange = noop): T => {
    const wrap = (v: any) => {
      // Ignore non-object like value.
      if (!Array.isArray(v) && !isObject(v)) {
        return v;
      }

      return new Proxy(v, {
        deleteProperty: (target, property) => {
          if (Array.isArray(target)) {
            return Reflect.deleteProperty(target, property);
          }

          const last = clone(target);
          const result = Reflect.deleteProperty(target, property);
          if (
            // Skip if unchanged.
            !isEqual(last, target)
          ) {
            onChange();
          }
          return result;
        },

        set: (target, property, val, receiver) => {
          if (Array.isArray(target)) {
            const result = Reflect.set(
              target,
              property,
              watch(val, onChange),
              receiver,
            );
            if (property === "length") {
              onChange();
            }
            return result;
          }

          const last = clone(target);
          const result = Reflect.set(
            target,
            property,
            watch(val, onChange),
            receiver,
          );

          if (
            // Skip if unchanged.
            !isEqual(last, target)
          ) {
            onChange();
          }
          return result;
        },
      });
    };

    if (Array.isArray(value)) {
      return wrap(value.map((v) => wrap(v)));
    } else if (isObject(value)) {
      const obj = value as Record<string, any>;
      const keys = Object.keys(obj);
      return wrap(
        keys.reduce(
          (acc, key) => {
            acc[key] = wrap(obj[key]);
            return acc;
          },
          {} as Record<string, any>,
        ),
      );
    } else {
      // Ignore non-object like value.
      return value;
    }
  };

  const propagateChange = () => {
    signal.value = watch(signal.value, propagateChange);
  };

  const signal = asSignal(watch(value, propagateChange));

  return new Proxy(signal, {
    get(target: Signal<T>, p: string | symbol, receiver: any): any {
      // Override "Signal.toJSON" method.
      if (p === "toJSON") {
        return () => {
          return clone(target.value);
        };
      }
      return Reflect.get(target, p, receiver);
    },

    set: (target, property, val, receiver) => {
      if (property === "value") {
        // Start watching values for "immutable assignment".
        val = watch(val, propagateChange);
      }
      return Reflect.set(target, property, val, receiver);
    },
  });
};
