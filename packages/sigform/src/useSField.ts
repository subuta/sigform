import { SFieldOpts, SFormContext, useSFormContext } from "./SForm";
import { getDeepSignal } from "./deepSignal";
import { signal as createSignal } from "@preact/signals-core";
import { Signal, useComputed } from "@preact/signals-react";
import { useCallback, useEffect, useMemo } from "react";
import invariant from "tiny-invariant";

const useRawSField = <T>(name: string, opts?: SFieldOpts) => {
  const ctx = SFormContext.useContainer();

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
  } = ctx;
  if (strict) {
    invariant(data.value[name], `${name} not found in initialData`);
  }

  const signal: Signal<T> = useMemo(() => {
    const signal = getDeepSignal(data, name);
    if (signal !== undefined) {
      return signal;
    } else if (opts?.defaultValue !== undefined) {
      return createSignal(opts?.defaultValue);
    }
    return createSignal(null);
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
): [Signal<T>, SFieldHelpers<T>] => {
  const { signal, ...rest } = useRawSField<T>(name, opts);
  return [signal, rest];
};

export type SFormHelpers = {
  formId: string;
  reset: ReturnType<typeof useSFormContext>["reset"];
  setFormErrors: ReturnType<typeof useSFormContext>["setFormErrors"];
};
