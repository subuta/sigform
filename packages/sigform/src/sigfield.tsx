import { SigFormContextHelpers, useSigformContext } from "./context";
import { mutate } from "./util";
import { Patch, enablePatches } from "immer";
import { Producer } from "immer/src/types/types-external";
import React, { useState } from "react";

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

export const sigfield = <P = any, T = any, E = string>(
  Component: (props: SigfieldProps<P, T, E>) => JSX.Element,
) => {
  const Raw = (
    props: Omit<P, "onChange" | "name" | "value"> & RawFieldProps<T, E>,
  ) => {
    const { defaultValue, value, onChange, error, ...rest } = props;

    // Use internal "state" for "defaultValue-only" scenario.
    const [state, setState] = useState<T | undefined>(
      defaultValue === undefined ? undefined : defaultValue,
    );

    // "value" which we will work on.
    const currentValue = value === undefined ? state : value;

    const mutateFn = (recipe: Producer<T>) => {
      const [nextState, patches] = mutate(currentValue, recipe);
      setState(nextState);
      onChange && onChange(nextState, patches);
    };

    return (
      <Component
        {...(rest as any)}
        error={error}
        mutate={mutateFn}
        setValue={(value: T) => mutateFn(() => value as any)}
        value={currentValue}
        defaultValue={defaultValue}
      />
    );
  };

  // Use "name & defaultValue" IF (FormField) as default renderer.
  const render = (
    props: Omit<P, "onChange" | "name" | "value"> & FormFieldProps<T, E>,
  ) => {
    const ctx = useSigformContext();
    const { defaultValue, name, helpers, ...rest } = props;
    return (
      <Raw
        {...ctx.register(name, defaultValue)}
        name={name}
        {...(rest as any)}
      />
    );
  };

  // Also expose "Component.Raw" renderer for traditional "onChange & value" usage (& nested field).
  render.Raw = Raw;

  return render;
};
