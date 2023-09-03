import {
  SFieldOpts,
  SFormContext,
  SFormContextType,
  useSFormContext,
} from "./SForm";
import {
  DeepArraySignal,
  DeepObjectSignal,
  DeepSignal,
  deepSignal,
  getDeepSignal,
} from "./deepSignal";
import { Signal, useComputed } from "@preact/signals-react";
import { useCallback, useEffect, useMemo } from "react";
import invariant from "tiny-invariant";

const useRawSField = <T>(name: string, opts?: SFieldOpts) => {
  const ctx = useSFormContext();

  const {
    data,
    strict,
    errors,
    registerField,
    unRegisterField,
    getFieldValue,
    getData,
    formId,
    setFieldValues,
    setFieldError,
    clearFieldError,
    clearFieldValue,
    watchData: watchFormData,
  } = opts?.formCtx || ctx;
  const signal: DeepSignal<T> = useMemo(() => {
    const signal = getDeepSignal(data, name);
    if (strict && !signal) {
      invariant(false, `${name} not found in initialData`);
    }
    if (signal !== undefined) {
      return signal;
    } else if (opts?.defaultValue !== undefined) {
      return deepSignal(opts?.defaultValue);
    }
    return deepSignal(null);
  }, []);

  const error = useMemo(() => {
    return errors[name];
  }, [errors, name]);

  useEffect(() => {
    // Automatically register on mount.
    registerField({
      name,
      value: signal,
      clearValue: opts?.clearValue,
    });

    return () => {
      // Also automatically unregister on unmount.
      unRegisterField(name);
    };
  }, []);

  // Watch field changes.
  const watchField = useCallback(function <T>(
    fieldName: string,
    cb: (value: Signal<T> | null) => T,
  ) {
    return useComputed(() => cb(getFieldValue(fieldName)));
  }, []);

  const setError = useCallback(
    (error: any) => {
      setFieldError(name, error);
    },
    [setFieldError, name],
  );

  const clearError = useCallback(() => {
    clearFieldError(name);
  }, [clearFieldError, name]);

  const clearField = useCallback(() => {
    clearFieldValue(name);
  }, [clearFieldValue, name]);

  return {
    signal,
    error,
    formId,
    watchFormData,
    watchField,
    setFieldValues,
    setError,
    clearError,
    clearField,
    getData,
  };
};

type SFieldHelpers<T> = Omit<ReturnType<typeof useRawSField<T>>, "signal">;

export const useSField = <T>(
  name: string,
  opts?: SFieldOpts,
): [DeepSignal<T>, SFieldHelpers<T>] => {
  const { signal, ...rest } = useRawSField<T>(name, opts);
  return [signal, rest];
};

export const useSArrayField = <T>(
  name: string,
  opts?: SFieldOpts,
): [DeepArraySignal<T>, SFieldHelpers<T>] => {
  const { signal, ...rest } = useRawSField<T>(name, opts);

  // @ts-ignore
  const array = signal as DeepArraySignal<T>;

  return [array, rest];
};

export const useSObjectField = <T>(
  name: string,
  opts?: SFieldOpts,
): [DeepObjectSignal<T>, SFieldHelpers<T>] => {
  const { signal, ...rest } = useRawSField<T>(name, opts);

  // @ts-ignore
  const object = signal as DeepObjectSignal<T>;

  return [object, rest];
};

export type SFormHelpers = {
  formId: string;
  reset: ReturnType<typeof useSFormContext>["reset"];
  setFormErrors: ReturnType<typeof useSFormContext>["setFormErrors"];
};
