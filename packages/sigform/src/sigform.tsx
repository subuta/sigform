import {
  SigFormContextHelpers,
  SigformContext,
  useSigformContext,
} from "./context";
import { signal } from "@preact/signals-core";
import { Signal, untracked, useSignalEffect } from "@preact/signals-react";
import React, {
  ComponentType,
  FormEvent,
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import invariant from "tiny-invariant";

type ChildrenProps = {
  children: ReactNode;
};

const sigform = <P,>(Component: ComponentType<P>) => {
  return forwardRef((props: SigFormComponentProps<P>, ref) => {
    return (
      <SigformContext.Provider>
        <Component {...(props as any)} ref={ref} />
      </SigformContext.Provider>
    );
  });
};

export type SigFormHelpers = Pick<
  SigFormContextHelpers,
  "setFormErrors" | "clearFormErrors" | "setFormValues"
>;

export type SigFormComponentProps<P> = P & {
  onChange?: (value: any, helpers: SigFormHelpers) => void;
  onSubmit?: (value: any, helpers: SigFormHelpers, event?: FormEvent) => void;
  signal?: Signal<any>;
  className?: string;
};

export const SigForm = sigform(
  forwardRef((props: SigFormComponentProps<ChildrenProps>, outerRef) => {
    const { onSubmit, onChange, children, className = "" } = props;
    const ctx = useSigformContext();

    // Use provided signal or create own.
    const form = useMemo(
      () => props.signal ?? signal<Record<string, any> | undefined>(undefined),
      [],
    );

    const name = ctx.formId;
    const ref = useRef<any>(null);

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
        onChange && onChange(form.peek(), helpers);
      });
    });

    const handleRef = useCallback((r: any) => {
      if (typeof outerRef === "function") {
        outerRef(r);
      } else if (outerRef) {
        outerRef.current = r;
      }
      ref.current = r;
    }, []);

    // Use form only if "onSubmit" specified.
    if (onSubmit) {
      return (
        <form
          className={className}
          onSubmit={(e) => {
            // Prevent default "form submit"
            e.preventDefault();
            // And handle form submission by user defined 'onSubmit' handler.
            onSubmit && onSubmit(form.value, helpers, e);
          }}
          ref={handleRef}
        >
          {children}
        </form>
      );
    }

    // Or defaults to "div" which allow nesting.
    return (
      <div className={className} ref={handleRef}>
        {children}
      </div>
    );
  }),
);
