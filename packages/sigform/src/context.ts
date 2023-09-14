import { flatten, getFormData, isObject, set, sortFields } from "./util";
import { Signal, useSignal } from "@preact/signals-react";
import { useCallback, useId, useRef, useState } from "react";
import isEqual from "react-fast-compare";
import { createContainer } from "unstated-next";

export type SigFormField<T> = {
  fieldTree?: string[];
  name: string;
  value: Signal<T>;
};

export type SigFormErrors = Record<string, string | undefined>;

export type SigFormData = Record<string, any>;

export const useSigform = () => {
  const formId = useId();

  const fields = useSignal<SigFormField<any>[]>([]);
  const [errors, setErrors] = useState<SigFormErrors>({});

  const registerField = useCallback(function <T>(
    fieldTree: string[],
    value: Signal<T>,
  ) {
    const name = fieldTree.join(".");
    if (!name) return;

    // console.log("register", name);

    fields.value = [
      ...fields.value,
      {
        fieldTree: fieldTree,
        name,
        value,
      },
    ];
    // Sort fields everytime after registration.
    fields.value = sortFields(fields.value);
  }, []);

  const unRegisterField = useCallback((fieldName: string) => {
    if (!fieldName) return;

    // console.log("unregister", fieldName);

    fields.value = fields.value.filter((field) => field.name !== fieldName);
    // Sort fields everytime after un-registration.
    fields.value = sortFields(fields.value);
  }, []);

  const getField = useCallback((fieldName: string) => {
    return fields.value.find((field) => field.name === fieldName);
  }, []);

  // Get field's value.
  const getFieldValue = useCallback((fieldName: string) => {
    const field = getField(fieldName);
    return field ? field.value : null;
  }, []);

  const setFieldValue = useCallback((fieldName: string, value: any) => {
    const signal = getFieldValue(fieldName);

    if (!signal) {
      return false;
    }

    signal.value = value;
  }, []);

  const setFormValues = useCallback((rawData: SigFormData, prefix = formId) => {
    const data = flatten({
      [prefix]: rawData,
    }) as Record<string, any>;

    const fieldNames = Object.keys(data);
    fieldNames.forEach((name) => {
      const value = data[name];
      setFieldValue(name, value);
    });

    return true;
  }, []);

  // Update Array / Object signal by proper way.
  const updateDeepSignal = useCallback(
    (parent: Signal<any>, key: string, signal: Signal<any>) => {
      if (Array.isArray(parent.value)) {
        const temp = [...parent.value];
        set(temp, key, signal.value);
        parent.value = temp;
      } else if (isObject(parent.value)) {
        parent.value = { ...parent.value, [key]: signal.value };
      } else {
        parent.value = signal.value;
      }
    },
    [],
  );

  const propagateChange = useCallback(
    (fullFieldName: string, fieldName: string) => {
      if (!fullFieldName) return;

      const field = getField(fullFieldName);
      if (!field) return;

      const names = [...(field.fieldTree as string[])];
      names.pop();

      // Stop if reached at root.
      if (names.length === 0) {
        return;
      }

      // Do propagate changes to parent if parent field found.
      const parentName = names.join(".");
      const parentField = getField(parentName);
      if (parentField) {
        updateDeepSignal(parentField.value, fieldName, field.value);
      }
    },
    [],
  );

  const getFormDataMemo = useCallback((name = "") => {
    return getFormData(fields.value, name);
  }, []);

  const setErrorsIfChanged = (nextErrors: SigFormErrors) => {
    if (isEqual(nextErrors, errors)) return;
    setErrors(nextErrors);
  };

  const setFormErrors = useCallback(
    (formErrors: Record<string, any>, prefix = formId) => {
      setErrorsIfChanged(
        flatten({
          [prefix]: formErrors,
        }),
      );
    },
    [],
  );

  const clearFormErrors = useCallback(() => {
    setFormErrors({});
  }, []);

  return {
    formId,
    fields,
    registerField,
    getField,
    unRegisterField,
    propagateChange,
    getFormData: getFormDataMemo,
    errors,
    setFormErrors,
    clearFormErrors,
    setFormValues,
  };
};

export const SigformContext = createContainer(useSigform);
export const useSigformContext = SigformContext.useContainer;

export type SigFormContextHelpers = ReturnType<typeof useSigform>;
