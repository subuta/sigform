import { createContainer } from "./lib/unstated-next";
import { ReadonlySignal, Signal, useComputed } from "@preact/signals-react";
import dot from "dot-object";
import {
  ComponentType,
  HTMLProps,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useId } from "react";
import { createPortal } from "react-dom";

export type SFormField<T> = {
  name: string;
  value: Signal<T>;
  initialValue?: T;
};

export type SFormData = Record<string, any>;
export type SFormErrors = Record<string, string | undefined>;

export type SFormContextProps = {
  initialData?: SFormData;
};

const useSFormContext = (initialState?: SFormContextProps) => {
  const initialData = initialState?.initialData || {};

  // Make each form has uniqueId over universal rendering (SSR vs CSR).
  // SEE: [Generating unique ID's and SSR (for a11y and more) · Issue #5867 · facebook/react](https://github.com/facebook/react/issues/5867)
  const formId = useId();
  const fields = useRef<SFormField<any>[]>([]);
  const [errors, setErrors] = useState<SFormErrors>({});

  const registerField = useCallback(function <T>(field: SFormField<T>) {
    // Keep copy of initialValue for later usage.
    if (!field.initialValue) {
      field.initialValue = field.value.peek();
    }
    fields.current.push(field);
  }, []);

  const unRegisterField = useCallback((fieldName: string) => {
    const fieldIndex = fields.current.findIndex(
      (field) => field.name === fieldName,
    );

    if (fieldIndex > -1) {
      fields.current.splice(fieldIndex, 1);
    }
  }, []);

  const getData = useCallback(() => {
    const data: SFormData = {};

    fields.current.forEach((field) => {
      const signal = field.value;
      data[field.name] = signal.value;
    });

    // Parse key and construct resulting object.
    dot.object(data);

    return data;
  }, []);

  const getField = useCallback((fieldName: string) => {
    return fields.current.find((field) => field.name === fieldName);
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
    const parsedErrors = dot.dot(formErrors);

    setErrors(parsedErrors);
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((state) => ({ ...state, [fieldName]: undefined }));
  }, []);

  const setFieldError = (fieldName: string, error: any) => {
    setErrors((state) => ({ ...state, [fieldName]: error }));
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
    field.value.value = field.initialValue;
  }, []);

  const reset = useCallback((data: SFormData = {}) => {
    fields.current.forEach(({ name }) => {
      if (data[name]) {
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
    initialData,
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

export const useSField = <T,>(name: string, signal: Signal<T>) => {
  const {
    initialData,
    errors,
    registerField,
    unRegisterField,
    getFieldValue,
    getData,
    formId,
    setFieldValues,
    setFieldError,
    clearFieldError,
    clearFieldValue,
    watchData: watchFormData,
  } = SFormContext.useContainer();

  const defaultValue = useMemo(() => {
    return dot.pick(name, initialData);
  }, [name, initialData]);

  const error = useMemo(() => {
    return errors[name];
  }, [errors, name]);

  // Always unregister  on unmount.
  useEffect(() => {
    // Apply defaultValue on mount automatically.
    if (defaultValue) {
      signal.value = defaultValue;
    }
    return () => {
      unRegisterField(name);
    };
  }, [name]);

  // Watch field changes.
  const watchField = useCallback(function <T>(
    fieldName: string,
    cb: (value: Signal<T> | null) => T,
  ) {
    return useComputed(() => cb(getFieldValue(fieldName)));
  }, []);

  const setError = useCallback(
    (error: any) => {
      setFieldError(name, error);
    },
    [setFieldError, name],
  );

  const clearError = useCallback(() => {
    clearFieldError(name);
  }, [clearFieldError, name]);

  const clearField = useCallback(() => {
    clearFieldValue(name);
  }, [clearFieldValue, name]);

  // SEE: [javascript - Make React useEffect hook not run on initial render - Stack Overflow](https://stackoverflow.com/a/53254028)
  // Do register on initial render.
  const initial = useRef(true);
  if (initial.current) {
    initial.current = false;
    registerField({
      name,
      value: signal,
    });
  }

  return {
    defaultValue,
    error,
    formId,
    watchFormData,
    watchField,
    setFieldValues,
    setError,
    clearError,
    clearField,
    getData,
  };
};

export type SFormHelpers = {
  formId: string;
  reset: ReturnType<typeof useSFormContext>["reset"];
};

export type SFormConsumerProps = {
  children: ReactNode | ComponentType;
  onSubmit?: (data: SFormData, helpers: SFormHelpers) => void;
  initialData?: SFormContextProps["initialData"];
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
  const { formId, getData, reset } = SFormContext.useContainer();
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
              onSubmit(getData(), { formId, reset });
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

export const SForm = (props: SFormProps) => {
  const { onSubmit, initialData } = props;

  let children = props.children;
  if (typeof children === "function") {
    // Accepts renderFn as children.
    const Component = children;
    children = <Component />;
  } else {
    children = props.children;
  }

  return (
    <SFormContext.Provider initialState={{ initialData }}>
      <SFormConsumer onSubmit={onSubmit}>{children}</SFormConsumer>
    </SFormContext.Provider>
  );
};

SForm.Submit = (props: HTMLProps<HTMLButtonElement>) => {
  const { formId } = SFormContext.useContainer();
  return <button {...props} type="submit" form={formId} />;
};
