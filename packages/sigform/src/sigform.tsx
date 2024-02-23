import {
  SigFormComponentProps,
  SigFormHelpers,
  SigformContext,
  useSigformContext,
} from "./context";
import React, {
  ComponentType,
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
} from "react";

export const isEmptyChildren = (children: any): boolean =>
  React.Children.count(children) === 0;

export const isFunction = (obj: any): obj is Function =>
  typeof obj === "function";

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
  children: ((props: SigFormHelpers) => ReactNode) | ReactNode;
};

export const SigForm = sigform(
  forwardRef((props: SigFormComponentProps<ChildrenProps>, outerRef) => {
    const { className = "", onSubmit } = props;

    const ctx = useSigformContext();

    const ref = useRef<any>(null);

    const root = ctx.root;

    useEffect(() => {
      // Register form "onChange" into context.
      ctx.registerForm((data) => {
        props.onChange && props.onChange(data, helpers);
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
    if (isFunction(props.children)) {
      children = props.children(helpers);
    } else if (!isEmptyChildren(props.children)) {
      children = props.children;
    }

    // Use form only if "onSubmit" specified.
    if (onSubmit) {
      return (
        <form
          className={className}
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
    }

    // Or defaults to "div" which allow nesting.
    return (
      <div className={className} ref={handleRef}>
        {children}
      </div>
    );
  }),
);
