import { useSigformContext } from "./context";
import { deepSignal, meta } from "./deepSignal";
import { computeFieldTree, get } from "./util";
import {
  Signal,
  signal as asSignal,
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
  setFormValues: (rawData: any) => void;
};

export type RawFieldProps<P, T> = P & {
  // Signal instance represents field value.
  field: Signal<T>;
};

export type SigfieldProps<P, T, E = string> = RawFieldProps<P, T> & {
  // Name of field
  name?: string;
  // Error of field
  error?: E;
  // Field helpers.
  helpers?: sigfieldHelpers;
};

export type OutersigfieldProps<T> = {
  // sigfield
  name?: string | number;
  defaultValue?: T;
};

export type OuterRawFieldProps<T, E> = {
  error?: E;
  signal?: Signal<T>;
  onChange?: (value: T) => void;
  value?: T;
};

export const sigfield = <P = any, T = any, E = string>(
  RawComponent: ForwardRefRenderFunction<any, SigfieldProps<P, T, E>>,
) => {
  // Wrap component in forwardRef.
  const Component = forwardRef(RawComponent);

  // Use "sigfield" as default renderer
  const render = (
    props: Omit<P, "name" | "defaultValue"> & OutersigfieldProps<T>,
  ) => {
    const { defaultValue, ...rest } = props;
    const name = String(props.name);

    const ctx = useSigformContext();

    // Use provided signal or create own.
    const field = useMemo(
      () => deepSignal(defaultValue ?? null) as Signal<T>,
      [],
    );

    const { fieldTree, fullFieldName, ref } = useSyncFieldName(
      name,
      ctx.formId,
    );

    const error = useMemo(() => {
      return get(ctx.errors, fullFieldName.value);
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
      ctx.propagateChange(fullFieldName.peek(), name);
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
      setFormValues: ctx.setFormValues,
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
  render.Raw = (
    props: Omit<P, "onChange" | "value"> & OuterRawFieldProps<T, E>,
  ) => {
    const { value, onChange, signal, ...rest } = props;

    const emptyValue = value === undefined;

    if (signal && value) {
      invariant(
        false,
        `Not allowed to pass 'signal' and 'value & onChange' same time.`,
      );
    } else if (!signal && emptyValue) {
      invariant(false, `Must have 'signal' or 'value & onChange' props`);
    }

    // Use provided signal or create own.
    const field = useMemo(
      () => signal ?? (deepSignal(value ?? (undefined as any)) as Signal<T>),
      [],
    );

    // Apply outside value changes
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
