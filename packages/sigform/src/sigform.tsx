import {
  SigFormComponentProps,
  SigformContext,
  useSigformContext,
} from "./context";
import React, {
  ComponentType,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
} from "react";

export const isEmptyChildren = (children: any): boolean =>
  React.Children.count(children) === 0;

export const isFunction = (obj: any): obj is Function =>
  typeof obj === "function";

const sigform = (Component: ComponentType) => {
  // use "forwardRef" here for relay ref to "Component", not "Provider".
  return forwardRef((props: SigFormComponentProps, ref) => {
    return (
      <SigformContext.Provider>
        <Component {...(props as any)} ref={ref} />
      </SigformContext.Provider>
    );
  });
};

export const SigForm = sigform(
  forwardRef((props: SigFormComponentProps, outerRef) => {
    const { onSubmit, onChange, children: childrenProp, ...rest } = props;

    const ctx = useSigformContext();

    const ref = useRef<any>(null);

    const root = ctx.root;

    useEffect(() => {
      // Register form "onChange" into context.
      ctx.registerForm((data) => {
        onChange && onChange(data, helpers);
      });
    }, []);

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
      resetFormValue: ctx.resetFormValue,
      setFieldValues: ctx.setFieldValues,
      register: ctx.register,
      root,
    };

    let children = null;
    if (isFunction(childrenProp)) {
      children = childrenProp(helpers);
    } else if (!isEmptyChildren(childrenProp)) {
      children = childrenProp;
    }

    return (
      <form
        {...rest}
        onSubmit={(e) => {
          // Prevent default "form submit"
          e.preventDefault();
          // And handle form submission by user defined 'onSubmit' handler.
          onSubmit && onSubmit(root, helpers, e);
        }}
        ref={handleRef}
      >
        {children}
      </form>
    );
  }),
);
