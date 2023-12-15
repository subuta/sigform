import {
  SigFormComponentProps,
  SigformContext,
  useSigformContext,
} from "./context";
import { clone } from "./util";
import React, {
  ComponentType,
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
} from "react";
import invariant from "tiny-invariant";

const sigform = <P,>(Component: ComponentType<P>) => {
  return forwardRef((props: SigFormComponentProps<P>, ref) => {
    return (
      <SigformContext.Provider>
        <Component {...(props as any)} ref={ref} />
      </SigformContext.Provider>
    );
  });
};

type ChildrenProps = {
  children: ReactNode;
};

export const SigForm = sigform(
  forwardRef((props: SigFormComponentProps<ChildrenProps>, outerRef) => {
    const { onSubmit, defaultValue, children } = props;

    const ctx = useSigformContext();

    const name = ctx.formId;
    const ref = useRef<any>(null);

    const formData = ctx.data[name];

    useEffect(() => {
      // Set name(formId) to data attribute.
      invariant(ref.current, "must exists");
      ref.current.dataset.sigform = name;

      // Fetch value on mount.
      requestAnimationFrame(() => {
        // Register form into context.
        ctx.bindForm(name, defaultValue || {}, (data) => {
          props.onChange && props.onChange(data, helpers);
        });
      });

      return () => {
        // Unregister form context on unmount.
        ctx.unRegisterField(name);
      };
    }, [name]);

    const handleRef = useCallback((r: any) => {
      if (typeof outerRef === "function") {
        outerRef(r);
      } else if (outerRef) {
        outerRef.current = r;
      }
      ref.current = r;
    }, []);

    const helpers = {
      setFormErrors: ctx.setFormErrors,
      clearFormErrors: ctx.clearFormErrors,
      setFormValues: ctx.setFormValues,
    };

    // Use form only if "onSubmit" specified.
    if (onSubmit) {
      return (
        <form
          onSubmit={(e) => {
            // Prevent default "form submit"
            e.preventDefault();
            // And handle form submission by user defined 'onSubmit' handler.
            onSubmit && onSubmit(clone(formData), helpers, e);
          }}
          ref={handleRef}
        >
          {children}
        </form>
      );
    }

    // Or defaults to "div" which allow nesting.
    return <div ref={handleRef}>{children}</div>;
  }),
);
