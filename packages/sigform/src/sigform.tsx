import {
  SigFormContextHelpers,
  SigformContext,
  useSigformContext,
} from "./context";
import { untracked, useSignal, useSignalEffect } from "@preact/signals-react";
import React, {
  ComponentType,
  FormEvent,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import invariant from "tiny-invariant";

type ChildrenProps = {
  children: ReactNode;
};

const sigform = <P,>(Component: ComponentType<P>) => {
  return (props: P & SigFormComponentProps<{}>) => {
    return (
      <SigformContext.Provider>
        <Component {...(props as any)} />
      </SigformContext.Provider>
    );
  };
};

export type SigFormHelpers = Pick<
  SigFormContextHelpers,
  "setFormErrors" | "clearFormErrors" | "setFormValues"
>;

export type SigFormComponentProps<P> = P & {
  onChange?: (value: any, helpers: SigFormHelpers) => void;
  onSubmit?: (value: any, helpers: SigFormHelpers, event?: FormEvent) => void;
};

export const SigForm = sigform(
  (props: SigFormComponentProps<ChildrenProps>) => {
    const { onSubmit, onChange, children } = props;
    const ctx = useSigformContext();

    const name = ctx.formId;
    const form = useSignal<Record<string, any> | undefined>(undefined);
    const ref = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
      // Set name(formId) to data attribute.
      invariant(ref.current, "must exists");
      ref.current.dataset.sigform = name;

      // Register form into context.
      ctx.registerField([name], form);

      // Fetch value on mount.
      requestAnimationFrame(() => {
        form.value = ctx.getFormData(name);
      });

      return () => {
        // Unregister form context on unmount.
        ctx.unRegisterField(name);
      };
    }, []);

    const helpers = {
      setFormErrors: ctx.setFormErrors,
      clearFormErrors: ctx.clearFormErrors,
      setFormValues: ctx.setFormValues,
    };

    useSignalEffect(() => {
      // Skip calling "onChange" fn for "undefined" value.
      if (form.value === undefined) return;
      // Subscribe change
      untracked(() => {
        onChange && onChange(form.value, helpers);
      });
    });

    return (
      <form
        className="p-4 bg-yellow-400"
        onSubmit={(e) => {
          // Prevent default "form submit"
          e.preventDefault();
          // And handle form submission by user defined 'onSubmit' handler.
          onSubmit && onSubmit(form.value, helpers, e);
        }}
        ref={ref}
      >
        {children}
      </form>
    );
  },
);
