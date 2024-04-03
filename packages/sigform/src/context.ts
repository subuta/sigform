import { OuterFieldProps, SigfieldHelpers } from "./sigfield";
import { get, mergeFlatten, set, wrapPatches } from "./util";
import { Field, dig, getTree } from "./util/fieldTree";
import { Patch, applyPatches, produce } from "immer";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useRef,
  useState,
} from "react";
import { createContainer } from "unstated-next";

export type SigFormErrors = Record<string, string[] | string | undefined>;

const useSigform = () => {
  const [root, setRoot] = useState<Field<any>>({
    value: {},
    name: "root",
  });
  const [errors, setErrors] = useState<SigFormErrors>({});
  const onChangeRef = useRef<Dispatch<SetStateAction<any>> | null>();

  const defaultValueQueue = useRef<any>({});
  const patchesQueue = useRef<Patch[]>([]);

  const hasFormMounted = !!onChangeRef.current;
  const applyOrQueuePatches = (patches: Patch[] = []) => {
    patchesQueue.current = patchesQueue.current.concat(patches);

    if (hasFormMounted) {
      setRoot((root) => {
        const nextState = produce(root, (draft: any) => {
          applyPatches(draft.value, patchesQueue.current);
        });
        // Emit form.onChange if defined.
        onChangeRef.current && onChangeRef.current(nextState.value);
        // Empty patchesQueue after processed.
        patchesQueue.current = [];
        return nextState;
      });
    }
  };

  const registerForm = function <T>(onChange?: Dispatch<SetStateAction<T>>) {
    onChangeRef.current = onChange;
    // Set defaultValue on form mount.
    setRoot((root) => {
      return produce(root, (draft: any) => {
        draft.value = mergeFlatten(draft.value, defaultValueQueue.current);
      });
    });
    // Apply queued patches on mount.
    applyOrQueuePatches();
  };

  const propagateChange = (field: Field<any>, patches: Patch[]) => {
    const names = getTree(field);
    const last = names.pop();
    // Stop if reached at root.
    if (last === "root") {
      applyOrQueuePatches(patches);
      return;
    }

    // Do propagate changes to parent if parent field found.
    if (field.parent) {
      const parentFieldName = names[names.length - 1];
      // Propagate changes to in-direct parent.
      if (parentFieldName && parentFieldName !== "root") {
        wrapPatches(patches, parentFieldName);
      }
      propagateChange(field.parent, patches);
    }
  };

  const setFormErrors = (formErrors: SigFormErrors) => {
    setErrors((errors) => mergeFlatten(errors, formErrors));
  };

  const clearFormErrors = () => {
    setErrors({});
  };

  // Reset whole form with provided value.
  const resetFormValue = (data: any) => {
    setRoot((root) =>
      produce(root, (draft) => {
        draft.value = data;
      }),
    );
  };

  // Set multiple field values at once (without reset)
  const setFieldValues = (fieldValues: any) => {
    setRoot((root) =>
      produce(root, (draft) => {
        draft.value = mergeFlatten(draft.value, fieldValues);
      }),
    );
  };

  const queueDefaultValueOfField = (
    fullFieldName: string,
    defaultValue: any,
  ) => {
    // Queue defaultValue for fields (will be applied "once" on initial form mount).
    defaultValueQueue.current[fullFieldName] = defaultValue;
  };

  // Register "Raw: onChange & value" component into "SigForm" context.
  const register = <T>(
    name: string,
    defaultValue: T | undefined,
    onChange: ((value: T, patches: Patch[]) => void) | undefined,
    parent = root,
  ) => {
    const field = dig(parent, name);
    const fieldTree = getTree(field);
    const fullFieldName = fieldTree.join(".");

    queueDefaultValueOfField(fullFieldName, defaultValue);

    const setFieldError = (formErrors: any) => {
      setFormErrors({ [fullFieldName]: formErrors });
    };

    const clearFieldError = () => {
      setFormErrors({ [fullFieldName]: "" });
    };

    const setFieldValue = (rawData: any) => {
      setFieldValues({ [fullFieldName]: rawData });
    };

    const helpers: Partial<SigfieldHelpers> = {
      clearFormErrors,
      resetFormValue,
      setFieldValues,
      setFieldError,
      clearFieldError,
      setFieldValue,
    };

    // Bind current "field" arg into "register" fn for nested field scenario.
    helpers.register = (
      name: string,
      defaultValue: T | undefined,
      onChange: ((value: T, patches: Patch[]) => void) | undefined,
    ) => register(name, defaultValue, onChange, field);

    const error = get(errors, fullFieldName);

    return {
      onChange(value: any, patches: Patch[]) {
        if (name !== null) {
          wrapPatches(patches, name);
        }
        propagateChange(field, patches);

        // Call "onChange" handler passed from component.
        if (onChange) {
          onChange(value, patches);
        }
      },
      value: field.value,
      defaultValue,
      error: error,
      helpers: helpers,
    } as OuterFieldProps<any, any>;
  };

  return {
    errors: errors.value,
    root: root.value,
    register,
    registerForm,
    propagateChange,
    setFormErrors,
    clearFormErrors,
    resetFormValue,
    setFieldValues,
  };
};

export type SigFormComponentProps<P> = P & {
  className?: string;
  onChange?: (value: any, helpers: SigFormHelpers) => void;
  onSubmit?: (value: any, helpers: SigFormHelpers, event?: FormEvent) => void;
};

export const SigformContext = createContainer(useSigform);
export const useSigformContext = SigformContext.useContainer;

export type SigFormContextHelpers = ReturnType<typeof useSigform>;

export type SigFormHelpers = Pick<
  SigFormContextHelpers,
  | "root"
  | "setFormErrors"
  | "clearFormErrors"
  | "resetFormValue"
  | "setFieldValues"
  | "register"
>;
