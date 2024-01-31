import { get, set, wrapPatches } from "./util";
import debounce from "debounce-fn";
import * as flat from "flat";
import { Patch, applyPatches, produce } from "immer";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useId,
  useRef,
  useState,
} from "react";
import isEqual from "react-fast-compare";
import { createContainer } from "unstated-next";

const flatten = flat.default.flatten;
const unflatten = flat.default.unflatten;

export type SigFormErrors = Record<string, string | undefined>;

export type SigFormField<T> = {
  fieldTree?: string[];
  name: string;
  onChange?: Dispatch<SetStateAction<T>>;
};

export const useSigform = () => {
  const formId = useId();
  const asData = (data: any) => {
    return unflatten(
      flatten({
        [formId]: data,
      }),
    ) as Record<string, any>;
  };

  const [data, setData] = useState<any>(asData(null));
  const fieldsRef = useRef<SigFormField<any>[]>([]);
  const [errors, setErrors] = useState<SigFormErrors>({});

  const registerField = function <T>(
    fieldTree: string[],
    value: T | null,
    onChange?: Dispatch<SetStateAction<T>>,
  ) {
    const name = fieldTree.join(".");
    if (!name) return;

    // Apply initial fieldValue.
    if (data !== null) {
      // Fetch latest "data" and call "produce" for mutable operation.
      setData((data: any) => {
        return produce(data, (draft: any) => {
          set(draft, name, value);
        });
      });
    }

    fieldsRef.current.push({
      fieldTree,
      name,
      onChange,
    });
  };

  const bindForm = function <T>(
    name: string,
    defaultValue: T | null,
    onChange?: Dispatch<SetStateAction<T>>,
  ) {
    registerField([name], defaultValue, (data) => {
      setData(asData(data));
      onChange && onChange(data);
    });
    setData(asData(defaultValue));
  };

  const unRegisterField = (fieldName: string) => {
    if (!fieldName) return;

    fieldsRef.current = fieldsRef.current.filter(
      (field) => field.name !== fieldName,
    );
  };

  const getField = (fieldName: string) => {
    return fieldsRef.current.find((field) => field.name === fieldName);
  };

  const getFieldValue = (fieldName: string) => get(data as any, fieldName);
  const getFieldIsReady = (fieldName: string | null) => {
    if (!fieldName) return false;
    return !!getField(fieldName);
  };

  const propagateChange = (fullFieldName: string, patches: Patch[]) => {
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
    const parentFieldName = names[names.length - 1];
    const hasParent = parentFieldName !== formId;

    const parentField = getField(parentName);
    if (parentField) {
      const parentValue = getFieldValue(parentName);
      const nextState = applyPatches(parentValue || {}, patches);

      parentField.onChange && parentField.onChange(nextState);

      // Propagate changes to in-direct parent.
      if (hasParent) {
        wrapPatches(patches, parentFieldName);
        propagateChange(parentName, patches);
      }
    }
  };

  // Debounce setErrors for preventing flicker on `clearFormErrors & setFormErrors` call in same tick.
  const setErrorsIfChanged = useCallback(
    debounce((nextErrors: SigFormErrors) => {
      if (isEqual(nextErrors, errors)) return;
      setErrors(nextErrors);
    }),
    [errors],
  );

  const setFormErrors = useCallback(
    (formErrors: Record<string, any>, prefix = formId) => {
      setErrorsIfChanged(
        unflatten(
          flatten({
            [prefix]: formErrors,
          }),
        ),
      );
    },
    [],
  );

  const clearFormErrors = useCallback(() => {
    setFormErrors({});
  }, []);

  const setFormValues = (value: any, prefix = formId) => {
    setData((data: any) => {
      return unflatten(
        flatten({
          [prefix]: value,
        }),
      );
    });
  };

  return {
    formId,
    bindForm,
    data,
    registerField,
    unRegisterField,
    propagateChange,
    getFieldValue,
    getFieldIsReady,
    setFormErrors,
    clearFormErrors,
    setFormValues,
    errors,
  };
};

export type SigFormComponentProps<P> = P & {
  className?: string;
  onChange?: (value: any, helpers: SigFormHelpers) => void;
  onSubmit?: (value: any, helpers: SigFormHelpers, event?: FormEvent) => void;
  defaultValue?: any;
};

export const SigformContext = createContainer(useSigform);
export const useSigformContext = SigformContext.useContainer;

export type SigFormContextHelpers = ReturnType<typeof useSigform>;

export type SigFormHelpers = Pick<
  SigFormContextHelpers,
  "setFormErrors" | "clearFormErrors" | "setFormValues"
>;
