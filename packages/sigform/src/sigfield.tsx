import { SigFormContextHelpers, useSigformContext } from "./context";
import { MutateResult, mutate } from "./util";
import { useStateWithCallback } from "./util/useStateWithCallback";
import { Patch, enablePatches, setAutoFreeze } from "immer";
import { Producer } from "immer/src/types/types-external";
import React, {
  ComponentType,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  forwardRef,
  useEffect,
} from "react";

setAutoFreeze(false);
enablePatches();

export type SigfieldHelpers = Pick<
  SigFormContextHelpers,
  "clearFormErrors" | "resetFormValue" | "setFieldValues" | "register"
> & {
  setFieldError: (formErrors: any) => void;
  clearFieldError: () => void;
  setFieldValue: (rawData: any) => void;
  setDefaultValue: (defaultValue: any) => void;
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
  onChange?: (value: T, patches: Patch[]) => void;
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
    Omit<P, "onChange" | "value"> & RawFieldProps<T, E>
  >((props, ref) => {
    const { defaultValue, value, onChange, error, ...rest } = props;

    // Use internal "state" for "defaultValue-only" scenario.
    const initialMutateResult: MutateResult<T | undefined> = [
      defaultValue === undefined ? undefined : defaultValue,
      [],
    ];
    const [[state], setState] = useStateWithCallback(initialMutateResult);

    // "value" which we will work on.
    const currentValue = value === undefined ? state : value;

    const mutateFn = (recipe: Producer<T>) => {
      setState(
        // Always use latest state.
        ([state]) => {
          const currentValue = value === undefined ? state : value;
          return mutate(currentValue, recipe);
        },
        (mutateResult) => {
          // Skip onChange for initial state.
          if (mutateResult === initialMutateResult) return;
          const [nextState, patches] = mutateResult;
          // Run "onChange" after setState is finished.
          onChange && onChange(nextState as T, patches);
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

  type DefaultRenderProps = Omit<P, "name"> & FormFieldProps<T, E>;

  // Use "name & defaultValue" IF (FormField) as default renderer.
  const render = forwardRef((props: DefaultRenderProps, ref) => {
    const ctx = useSigformContext();
    const { defaultValue, name, helpers, onChange, ...rest } = props;
    const binding = ctx.register(name, defaultValue, onChange);

    useEffect(() => {
      binding.helpers?.setDefaultValue(defaultValue);
    }, []);

    return <Raw {...binding} name={name} {...(rest as any)} ref={ref} />;
  }) as ForwardRefExoticComponentWithRaw<
    PropsWithoutRef<DefaultRenderProps> & RefAttributes<Ref>,
    typeof Raw
  >;

  // Also expose "Component.Raw" renderer for traditional "onChange & value" usage (& nested field).
  render.Raw = Raw;

  return render;
};
