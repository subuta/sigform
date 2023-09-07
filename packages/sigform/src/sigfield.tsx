import {
  SigFormContextHelpers,
  SigFormData,
  useSigformContext,
} from "./context";
import { computeFieldTree } from "./util";
import {
  Signal,
  untracked,
  useComputed,
  useSignal,
  useSignalEffect,
} from "@preact/signals-react";
import React, {
  ComponentType,
  Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import invariant from "tiny-invariant";

export type SigFieldHelpers = {
  clearFormErrors: () => void;
  setFieldError: (formErrors: any) => void;
  setFieldValue: (rawData: any) => void;
};

export type SigfieldProps<P, T> = P & {
  // Name of field
  name: string;
  // Signal instance represents field value.
  field: Signal<T>;
  // Use custom "dataRef" for applying "data-sigform" to component node.
  dataRef: Ref<any>;
  // Error of field
  error?: string;
  // Field helpers.
  helpers: SigFieldHelpers;
};

export type OuterSigfieldProps<T> = {
  name: string | number;
  defaultValue?: T;
};

// For debugging.
const DEBUG = false;

const useSyncFieldName = (name: string, formId: string) => {
  const fieldTree = useSignal<string[]>([]);
  const fullFieldName = useComputed(() => fieldTree.value.join("."));
  const dataRef = useRef<HTMLElement | null>(null);

  // Sync fieldName to DOM structure.
  useEffect(() => {
    // SEE: [reactjs - Typescript: how to declare a type that includes all types extending a common type? - Stack Overflow](https://stackoverflow.com/questions/57201223/typescript-how-to-declare-a-type-that-includes-all-types-extending-a-common-typ)
    const node = dataRef.current;

    invariant(
      node?.dataset,
      "dataRef must exists, are you forgotten to define 'ref={props.dataRef}' on field component?",
    );

    // Persist change into DOM.
    node.dataset.sigform = name;

    requestAnimationFrame(() => {
      // return computed fieldTree by walk parentNodes.
      fieldTree.value = computeFieldTree(node, formId);
    });
  }, [name]);

  return {
    fieldTree,
    fullFieldName,
    dataRef,
  };
};

export const sigfield = <P = any, T = any>(
  Component: ComponentType<SigfieldProps<P, T>>,
) => {
  return (props: P & OuterSigfieldProps<T>) => {
    const { defaultValue, ...rest } = props;
    const name = String(props.name);

    const ctx = useSigformContext();
    const field = useSignal<T | null>(defaultValue ?? null);

    const { fieldTree, fullFieldName, dataRef } = useSyncFieldName(
      name,
      ctx.formId,
    );

    const error = useMemo(() => {
      return ctx.errors[fullFieldName.value];
    }, [ctx.errors, fullFieldName.value]);

    // (re-)register field into context on fullFieldName change.
    useEffect(() => {
      ctx.registerField(fieldTree.value, field);
      return () => {
        ctx.unRegisterField(fullFieldName.value);
      };
    }, [fullFieldName.value]);

    // Subscribe field change
    useSignalEffect(() => {
      field.value;

      // Propagate change into parent.
      untracked(() => {
        ctx.propagateChange(fullFieldName.value, name);
      });
    });

    if (DEBUG) {
      // Track component mount & unmount.
      useSignalEffect(() => {
        if (!fullFieldName.value) return;

        console.log(
          `%c ${fullFieldName.value} mounted`,
          "background: #222; color: #bada55",
        );

        return () => {
          console.log(
            `%c ${fullFieldName.value} unmounted`,
            "background: #222; color: #bada55",
          );
        };
      });
    }

    const setFieldError = useCallback((formErrors: any) => {
      ctx.setFormErrors(formErrors, fullFieldName.peek());
    }, []);

    const setFieldValue = useCallback((rawData: any) => {
      ctx.setFormValues(rawData, fullFieldName.peek());
    }, []);

    const helpers: SigFieldHelpers = {
      clearFormErrors: ctx.clearFormErrors,
      setFieldError,
      setFieldValue,
    };

    return (
      <Component
        {...(rest as any)}
        key={name}
        name={name}
        field={field}
        dataRef={dataRef}
        error={error}
        helpers={helpers}
      />
    );
  };
};
