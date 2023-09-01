import { useDeepSignal } from "./deepSignal";
import { SFormHelpers } from "@/useSField";
import {
  ReadonlySignal,
  Signal,
  useComputed,
  useSignal,
} from "@preact/signals-react";
import { flatten } from "flat";
import React, {
  ComponentType,
  HTMLProps,
  ReactNode,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useId } from "react";
import { createPortal } from "react-dom";
import isEqual from "react-fast-compare";
import { createContainer } from "unstated-next";

export type SFormField<T> = {
  name: string;
  value: Signal<T>;
  initialValue?: T;
  clearValue?: T;
};

export type SFormData = Record<string, any>;
export type SFormErrors = Record<string, string | undefined>;

export type SFormContextProps = {
  initialData?: SFormData;
  strict?: boolean;
};

export const useSFormContext = (ctx?: SFormContextProps) => {
  const data = useDeepSignal<Record<string, Signal<any>>>(
    ctx?.initialData || {},
  );
  const strict = ctx?.strict || false;

  // Make each form has uniqueId over universal rendering (SSR vs CSR).
  // SEE: [Generating unique ID's and SSR (for a11y and more) · Issue #5867 · facebook/react](https://github.com/facebook/react/issues/5867)
  const formId = useId();
  // const fields = useRef<SFormField<any>[]>([]);
  const fields = useSignal<SFormField<any>[]>([]);
  const [errors, setErrors] = useState<SFormErrors>({});

  const setErrorsIfChanged = (nextErrors: SFormErrors) => {
    if (isEqual(nextErrors, errors)) return;
    setErrors(nextErrors);
  };

  const registerField = useCallback(function <T>(field: SFormField<T>) {
    // Keep copy of initialValue for later usage.
    if (field.initialValue === undefined) {
      field.initialValue = field.value.peek();
    }
    fields.value = [...fields.value, field];
  }, []);

  const unRegisterField = useCallback((fieldName: string) => {
    fields.value = fields.value.filter((field) => field.name !== fieldName);
  }, []);

  const getData = useCallback(() => {
    // Return serialized deepSignal data.
    return data.toJSON();
  }, []);

  const getField = useCallback((fieldName: string) => {
    return fields.value.find((field) => field.name === fieldName);
  }, []);

  // Get field's value.
  const getFieldValue = useCallback((fieldName: string) => {
    const field = getField(fieldName);
    return field ? field.value : null;
  }, []);

  // Watch form data changes.
  const watchData = useCallback(
    function <T>(cb: (data: SFormData) => T): ReadonlySignal<T> {
      return useComputed(() => cb(getData()));
    },
    [getData],
  );

  const setFormErrors = useCallback((formErrors: SFormErrors) => {
    setErrorsIfChanged(flatten(formErrors));
  }, []);

  const clearFieldError = (fieldName: string) => {
    setErrorsIfChanged({ ...errors, [fieldName]: undefined });
  };

  const setFieldError = (fieldName: string, error: any) => {
    setErrorsIfChanged({ ...errors, [fieldName]: error });
  };

  const setFieldValue = useCallback((fieldName: string, value: any) => {
    const signal = getFieldValue(fieldName);

    if (!signal) {
      return false;
    }

    signal.value = value;
  }, []);

  const clearFieldValue = useCallback((fieldName: string) => {
    const field = getField(fieldName);
    if (!field) {
      return false;
    }

    // Restore initialValue on "clear".
    const hasClearValue = field.clearValue !== undefined;
    field.value.value = hasClearValue ? field.clearValue : field.initialValue;
  }, []);

  const reset = useCallback((data: SFormData = {}) => {
    fields.value.forEach(({ name }) => {
      if (data[name] !== undefined) {
        setFieldValue(name, data[name]);
      } else {
        clearFieldValue(name);
      }
    });
  }, []);

  const setFieldValues = useCallback((data: SFormData = {}) => {
    data.forEach((value: any, name: string) => setFieldValue(name, value));
  }, []);

  return {
    data,
    strict,
    errors,
    formId,
    setFormErrors,
    registerField,
    unRegisterField,
    clearFieldError,
    setFieldError,
    setFieldValue,
    setFieldValues,
    getField,
    getFieldValue,
    clearFieldValue,
    getData,
    watchData,
    reset,
  };
};

export const SFormContext = createContainer(useSFormContext);

export type SFieldOpts = {
  defaultValue?: any;
  clearValue?: any;
};

export type SFormConsumerProps = {
  children: ReactNode | ComponentType;
  onSubmit?: (data: SFormData, helpers: SFormHelpers) => void;
  initialData?: SFormContextProps["initialData"];
  strict?: boolean;
};

const useFormPortal = (id = "sForm-portal") => {
  const [ref, setRef] = useState<Element | null>(null);

  useEffect(() => {
    let formPortal = document.querySelector("#" + id);
    if (!formPortal) {
      formPortal = document.createElement("div");
      formPortal.id = id;
      document.body.appendChild(formPortal);
    }
    setRef(formPortal);
  }, []);

  return ref;
};

const SFormConsumer = (props: SFormConsumerProps) => {
  const { formId, getData, reset, setFormErrors } = SFormContext.useContainer();
  const { children, onSubmit } = props;
  const formPortal = useFormPortal();

  const noop = !props.onSubmit;

  let form = (
    <form
      id={formId}
      onSubmit={
        onSubmit
          ? (e) => {
              // Prevent reloading tab.
              e.preventDefault();
              onSubmit(getData(), { formId, reset, setFormErrors });
            }
          : undefined
      }
    />
  );

  if (formPortal && noop) {
    form = createPortal(form, formPortal);
  }

  return (
    <>
      {form}
      {children}
    </>
  );
};

export type SFormProps = SFormConsumerProps;

export const SForm = memo(
  (props: SFormProps) => {
    const { onSubmit, initialData, strict } = props;

    let children = props.children;
    if (typeof children === "function") {
      // Accepts renderFn as children.
      const Component = children;
      children = <Component />;
    } else {
      children = props.children;
    }

    return (
      <SFormContext.Provider initialState={{ initialData, strict }}>
        <SFormConsumer onSubmit={onSubmit}>{children}</SFormConsumer>
      </SFormContext.Provider>
    );
  },
  // Ignore "prop" changes for SForm.
  // SEE: [memo – React](https://react.dev/reference/react/memo#specifying-a-custom-comparison-function)
  () => true,
);

export const SFormSubmit = (props: HTMLProps<HTMLButtonElement>) => {
  const { formId } = SFormContext.useContainer();
  return <button {...props} type="submit" form={formId} />;
};
