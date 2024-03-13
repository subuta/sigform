import { SigFormContextHelpers, useSigformContext } from "./context";
import { MutateResult, mutate } from "./util";
import { useStateWithCallback } from "./util/useStateWithCallback";
import { Patch, enablePatches } from "immer";
import { Producer } from "immer/src/types/types-external";
import React, {
  ComponentType,
  ForwardRefExoticComponent,
  ForwardRefRenderFunction,
  NamedExoticComponent,
  PropsWithoutRef,
  ReactNode,
  RefAttributes,
  WeakValidationMap,
  forwardRef,
  useState,
} from "react";

enablePatches();

export type SigfieldHelpers = Pick<
  SigFormContextHelpers,
  "clearFormErrors" | "resetFormValue" | "setFieldValues" | "register"
> & {
  setFieldError: (formErrors: any) => void;
  clearFieldError: () => void;
  setFieldValue: (rawData: any) => void;
};

export type SigfieldProps<P, T, E = string> = P & {
  // Passed name (optional for Raw component).
  name?: string;
  // Mutator
  mutate: (recipe: Producer<T>) => void;
  // Set value
  setValue: (value: T) => void;
  // Value (for Controlled component)
  value: T;
  // DefaultValue (for Uncontrolled component)
  defaultValue?: T;
  // Error of field
  error?: E;
  // Field helpers (to be passed from "ctx.register()" fn).
  helpers?: SigfieldHelpers;
};

export type OuterFieldProps<T, E> = {
  defaultValue?: T;
  // Field helpers (to be passed from "ctx.register()" fn).
  helpers?: SigfieldHelpers;
};

export type FormFieldProps<T, E> = OuterFieldProps<T, E> & {
  name: string;
};

export type RawFieldProps<T, E> = OuterFieldProps<T, E> & {
  onChange?: (value: T, patches: Patch[]) => void;
  value?: T;
  error?: E;
};

// Extend "ForwardRefExoticComponent" with "Raw" for allowing "Component.Raw" syntax works with "forwardRef()".
interface ForwardRefExoticComponentWithRaw<P, R>
  extends ForwardRefExoticComponent<P> {
  Raw: R;
}

export const sigfield = <P = any, T = any, E = string, Ref = any>(
  // SEE: [javascript - Typescript: How to type ForwardRefExoticComponent + ComponentType - Stack Overflow](https://stackoverflow.com/a/67084687)
  Component: ComponentType<SigfieldProps<P, T, E> & React.RefAttributes<Ref>>,
) => {
  const Raw = forwardRef<
    Ref,
    Omit<P, "onChange" | "name" | "value"> & RawFieldProps<T, E>
  >((props, ref) => {
    const { defaultValue, value, onChange, error, ...rest } = props;

    // Use internal "state" for "defaultValue-only" scenario.
    const [state, setState] = useStateWithCallback<T | undefined>(
      defaultValue === undefined ? undefined : defaultValue,
    );

    // "value" which we will work on.
    const currentValue = value === undefined ? state : value;

    const mutateFn = (recipe: Producer<T>) => {
      let mutateResults: MutateResult<T>[] = [];
      // Always use latest state.
      setState(
        (state) => {
          const currentValue = value === undefined ? state : value;
          const [nextState, patches] = mutate(currentValue, recipe);
          mutateResults.push([nextState, patches]);
          return nextState;
        },
        () => {
          // TODO: Preserve order of "pushed" results.
          const result = mutateResults.pop();
          if (result) {
            const [nextState, patches] = result;
            // Run "onChange" after setState is finished.
            onChange && onChange(nextState, patches);
          }
        },
      );
    };

    return (
      <Component
        {...(rest as any)}
        ref={ref}
        error={error}
        mutate={mutateFn}
        setValue={(value: T) => mutateFn(() => value as any)}
        value={currentValue}
        defaultValue={defaultValue}
      />
    );
  });

  type DefaultRenderProps = Omit<P, "onChange" | "name" | "value"> &
    FormFieldProps<T, E>;

  // Use "name & defaultValue" IF (FormField) as default renderer.
  const render = forwardRef((props: DefaultRenderProps, ref) => {
    const ctx = useSigformContext();
    const { defaultValue, name, helpers, ...rest } = props;
    return (
      <Raw
        {...ctx.register(name, defaultValue)}
        name={name}
        {...(rest as any)}
        ref={ref}
      />
    );
  }) as ForwardRefExoticComponentWithRaw<
    PropsWithoutRef<DefaultRenderProps> & RefAttributes<Ref>,
    typeof Raw
  >;

  // Also expose "Component.Raw" renderer for traditional "onChange & value" usage (& nested field).
  render.Raw = Raw;

  return render;
};
