import { get, mergeFlatten, set, wrapPatches } from "./util";
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
import { createContainer } from "unstated-next";

export type SigFormErrors = Record<string, string[] | string | undefined>;

export type SigFormField<T> = {
  fieldTree?: string[];
  name: string;
  onChange?: Dispatch<SetStateAction<T>>;
};

const useSigform = () => {
  const formId = useId();

  const [data, setData] = useState<any>(null);
  const fieldsRef = useRef<SigFormField<any>[]>([]);
  const onChangeRef = useRef<Dispatch<SetStateAction<any>>>();
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
    setData(defaultValue);
    onChangeRef.current = onChange;
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
    const isRoot = names.length === 0;
    if (isRoot) {
      const nextData = applyPatches(data || {}, patches);
      setData(nextData);
      // Emit form.onChange if defined.
      onChangeRef.current && onChangeRef.current(nextData);
      return;
    }

    // Do propagate changes to parent if parent field found.
    const parentName = names.join(".");
    const parentFieldName = names[names.length - 1];

    const parentField = getField(parentName);
    if (parentField) {
      const parentValue = getFieldValue(parentName);
      const nextState = applyPatches(parentValue || {}, patches);
      parentField.onChange && parentField.onChange(nextState);
      // Propagate changes to in-direct parent.
      wrapPatches(patches, parentFieldName);
      propagateChange(parentName, patches);
    }
  };

  const setFormErrors = (formErrors: SigFormErrors) => {
    setErrors(mergeFlatten(errors, formErrors));
  };

  const clearFormErrors = useCallback(() => {
    setFormErrors({});
  }, []);

  // Reset whole form with provided value.
  const resetFormValue = (data: any) => {
    setData(data);
  };

  // Set multiple field values at once (without reset)
  const setFieldValues = (fieldValues: any) => {
    setData(mergeFlatten(data, fieldValues));
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
    resetFormValue,
    setFieldValues,
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
  | "data"
  | "setFormErrors"
  | "clearFormErrors"
  | "resetFormValue"
  | "setFieldValues"
>;
