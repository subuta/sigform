import { getFormData, isObject, set, sortFields } from "./util";
import { Signal } from "@preact/signals-react";
import { flatten } from "flat";
import { useCallback, useId, useRef, useState } from "react";
import isEqual from "react-fast-compare";
import invariant from "tiny-invariant";
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

  const fields = useRef<SigFormField<any>[]>([]);
  const [errors, setErrors] = useState<SigFormErrors>({});

  const registerField = useCallback(function <T>(
    fieldTree: string[],
    value: Signal<T>,
  ) {
    const name = fieldTree.join(".");
    if (!name) return;

    // console.log("register", name);

    fields.current = [
      ...fields.current,
      {
        fieldTree: fieldTree,
        name,
        value,
      },
    ];
    // Sort fields everytime after registration.
    fields.current = sortFields(fields.current);
  }, []);

  const unRegisterField = useCallback((fieldName: string) => {
    if (!fieldName) return;

    // console.log("unregister", fieldName);

    fields.current = fields.current.filter((field) => field.name !== fieldName);
    // Sort fields everytime after un-registration.
    fields.current = sortFields(fields.current);
  }, []);

  const getField = useCallback((fieldName: string) => {
    return fields.current.find((field) => field.name === fieldName);
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
    return getFormData(fields.current, name);
  }, []);

  const setErrorsIfChanged = (nextErrors: SigFormErrors) => {
    if (isEqual(nextErrors, errors)) return;
    setErrors(nextErrors);
  };

  const setFormErrors = useCallback(
    (formErrors: Record<string, any>, prefix = formId) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setErrorsIfChanged(
            flatten({
              [prefix]: formErrors,
            }),
          );
        });
      });
    },
    [],
  );

  const clearFormErrors = useCallback(() => {
    setFormErrors({});
  }, []);

  return {
    formId,
    registerField,
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
