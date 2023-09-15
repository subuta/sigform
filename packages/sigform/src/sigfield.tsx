import { useSigformContext } from "./context";
import { deepSignal } from "./deepSignal";
import { computeFieldTree } from "./util";
import {
  Signal,
  untracked,
  useComputed,
  useSignal,
  useSignalEffect,
} from "@preact/signals-react";
import React, {
  ForwardRefRenderFunction,
  createRef,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import invariant from "tiny-invariant";

// For debugging.
const DEBUG = false;

const useSyncFieldName = (name: string, formId: string) => {
  const fieldTree = useSignal<string[]>([]);
  const fullFieldName = useComputed(() => fieldTree.value.join("."));
  const ref = useRef<HTMLElement | null>(null);

  const ctx = useSigformContext();

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
    // Re-compute fieldTree on DOM change.
    ctx.fields.value;
    requestAnimationFrame(() => {
      // SEE: [reactjs - Typescript: how to declare a type that includes all types extending a common type? - Stack Overflow](https://stackoverflow.com/questions/57201223/typescript-how-to-declare-a-type-that-includes-all-types-extending-a-common-typ)
      const node = ref.current;
      if (node) {
        // return computed fieldTree by walk parentNodes.
        fieldTree.value = computeFieldTree(node, formId);
      }
    });
  });

  return {
    fieldTree,
    fullFieldName,
    ref,
  };
};

export type sigfieldHelpers = {
  clearFormErrors: () => void;
  setFieldError: (formErrors: any) => void;
  setFieldValue: (rawData: any) => void;
};

export type RawFieldProps<P, T> = P & {
  // Signal instance represents field value.
  field: Signal<T>;
};

export type SigfieldProps<P, T> = RawFieldProps<P, T> & {
  // Name of field
  name?: string;
  // Error of field
  error?: string;
  // Field helpers.
  helpers?: sigfieldHelpers;
};

export type OutersigfieldProps<T> = {
  // sigfield
  name?: string | number;
  defaultValue?: T;
};

export type OuterRawFieldProps<T> = {
  signal?: Signal<T>;
  onChange?: (value: T) => void;
  value?: T;
};

export const sigfield = <P = any, T = any>(
  RawComponent: ForwardRefRenderFunction<any, SigfieldProps<P, T>>,
) => {
  // Wrap component in forwardRef.
  const Component = forwardRef(RawComponent);

  // Use "sigfield" as default renderer
  const render = (props: P & OutersigfieldProps<T>) => {
    const { defaultValue, ...rest } = props;
    const name = String(props.name);

    const ctx = useSigformContext();

    // Use provided signal or create own.
    const field = useMemo(() => deepSignal(defaultValue ?? null), []);

    const { fieldTree, fullFieldName, ref } = useSyncFieldName(
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

    const helpers: sigfieldHelpers = {
      clearFormErrors: ctx.clearFormErrors,
      setFieldError,
      setFieldValue,
    };

    return (
      <Component
        {...(rest as any)}
        name={name}
        field={field}
        ref={ref}
        error={error}
        helpers={helpers}
      />
    );
  };

  // Also export "RawField" as "Component.Raw"
  render.Raw = (props: P & OuterRawFieldProps<T>) => {
    const { value, onChange, signal, ...rest } = props;

    const emptyValue = value === undefined;

    if (signal && (value || onChange)) {
      invariant(
        false,
        `Not allowed to pass 'signal' and 'value & onChange' same time.`,
      );
    } else if (!signal && (emptyValue || !onChange)) {
      invariant(false, `Must have 'signal' or 'value & onChange' props`);
    }

    // Use provided signal or create own.
    const field = useMemo(
      () => signal ?? deepSignal<T | undefined>(value ?? undefined),
      [],
    );

    useEffect(() => {
      if (props.value === undefined) return;
      field.value = props.value;
    }, [props.value]);

    // Subscribe field change
    useSignalEffect(() => {
      if (field.value === undefined) return;

      onChange && onChange(field.value);
    });

    return <Component {...(rest as any)} field={field} />;
  };

  return render;
};
