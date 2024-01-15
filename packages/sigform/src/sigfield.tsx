import { useSigformContext } from "./context";
import { computeFieldTree, get, mutate } from "./util";
import { Patch, enablePatches } from "immer";
import { Producer } from "immer/src/types/types-external";
import React, {
  ForwardRefRenderFunction,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import invariant from "tiny-invariant";

enablePatches();

export type RawFieldProps<P, T> = P & {
  value: T;
  defaultValue?: T;
};

export type SigfieldHelpers = {
  clearFormErrors: () => void;
  setFieldError: (formErrors: any) => void;
  setFieldValue: (rawData: any) => void;
  setFormValues: (rawData: any) => void;
};

export type SigfieldProps<P, T, E = string> = RawFieldProps<P, T> & {
  // Name of field
  name: string | undefined;
  // Error of field
  error?: E;
  // Field helpers.
  helpers?: SigfieldHelpers;
  mutate: (recipe: Producer<T>) => void;
  setValue: (value: T) => void;
};

export type OuterSigfieldProps<T> = {
  // sigfield
  name?: string | number;
  defaultValue?: T;
};

export type OuterRawFieldProps<T, E> = {
  // Name of field
  name?: string | number;
  error?: E;
  onChange?: (value: T, patches: Patch[]) => void;
  defaultValue?: T;
  value?: T;
};

const useSyncFieldName = (name: string, formId: string) => {
  const [fieldTree, setFieldTree] = useState<string[]>([]);
  const fullFieldName = fieldTree.join(".");
  const ref = useRef<HTMLElement | null>(null);

  // Sync fieldName to DOM structure.
  useEffect(() => {
    // SEE: [reactjs - Typescript: how to declare a type that includes all types extending a common type? - Stack Overflow](https://stackoverflow.com/questions/57201223/typescript-how-to-declare-a-type-that-includes-all-types-extending-a-common-typ)
    const node = ref.current;

    invariant(
      node?.dataset,
      "ref must exists, are you forgotten to define 'ref={props.ref}' on field component?",
    );

    // Persist change into DOM.
    node.dataset.sigform = name;
  }, [name]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const node = ref.current;
      if (node) {
        // return computed fieldTree by walk parentNodes.
        const fieldTree = computeFieldTree(node, formId);
        setFieldTree(fieldTree);
      }
    });
  }, []);

  return {
    fieldTree,
    fullFieldName,
    ref,
  };
};

export const sigfield = <P = any, T = any, E = string>(
  RawComponent: ForwardRefRenderFunction<any, SigfieldProps<P, T, E>>,
) => {
  // Wrap component in forwardRef.
  const Component = forwardRef(RawComponent);
  // Use "sigfield" as default renderer
  const render = (
    props: Omit<P, "name" | "defaultValue"> & OuterSigfieldProps<T>,
  ) => {
    const { defaultValue, name = null, ...rest } = props;
    const nameStr = String(name);

    const ctx = useSigformContext();
    const { formId } = ctx;

    const { fieldTree, fullFieldName, ref } = useSyncFieldName(nameStr, formId);

    const defaultValueRef = useRef(defaultValue || undefined);
    const value = ctx.getFieldValue(fullFieldName) ?? defaultValueRef.current;

    const error = useMemo(() => {
      return get(ctx.errors, fullFieldName);
    }, [ctx.errors, fullFieldName]);

    useEffect(() => {
      if (!fullFieldName) {
        return;
      }
      ctx.registerField(fieldTree, defaultValueRef.current || null);
      return () => {
        ctx.unRegisterField(fullFieldName);
      };
    }, [fullFieldName]);

    const setFieldError = (formErrors: any) => {
      ctx.setFormErrors(formErrors, fullFieldName);
    };

    const setFieldValue = (rawData: any) => {
      ctx.setFormValues(rawData, fullFieldName);
    };

    const helpers: SigfieldHelpers = useMemo(() => {
      return {
        clearFormErrors: ctx.clearFormErrors,
        setFormValues: ctx.setFormValues,
        setFieldError,
        setFieldValue,
      };
    }, [ctx.data, ctx.errors]);

    const isReady = ctx.getFieldIsReady(fullFieldName);
    const mutateFn = (recipe: Producer<T>) => {
      const [nextState, patches] = mutate(value as any, recipe, name);
      if (isReady) {
        ctx.propagateChange(fullFieldName, patches);
      } else if (nextState) {
        // Keep "nextState" as defaultValue if not ready (not registered).
        defaultValueRef.current = nextState;
      }
    };

    return (
      <Component
        {...(rest as any)}
        name={name ? String(name) : undefined}
        helpers={helpers}
        error={error}
        mutate={mutateFn}
        setValue={(value: T) => mutateFn(() => value as any)}
        value={value}
        ref={ref}
      />
    );
  };

  // Also export "RawField" as "Component.Raw"
  render.Raw = (
    props: Omit<P, "onChange" | "value"> & OuterRawFieldProps<T, E>,
  ) => {
    const { name, defaultValue, value, onChange, error, ...rest } = props;

    // Use internal "state" for "defaultValue-only" scenario.
    const [state, setState] = useState<T | undefined>(
      defaultValue === undefined ? undefined : defaultValue,
    );

    // "value" which we will work on.
    const currentValue = value === undefined ? state : value;

    const mutateFn = (recipe: Producer<T>) => {
      const [nextState, patches] = mutate(currentValue, recipe, name);
      setState(nextState);
      onChange && onChange(nextState, patches);
    };

    return (
      <Component
        {...(rest as any)}
        name={name ? String(name) : undefined}
        error={error}
        mutate={mutateFn}
        setValue={(value: T) => mutateFn(() => value as any)}
        value={currentValue}
        defaultValue={defaultValue}
      />
    );
  };

  return render;
};
