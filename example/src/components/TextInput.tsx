import { useSignal, useSignalEffect } from "@preact/signals-react";
import cx from "classnames";
import { useSField } from "sigform";

type Props = {
  label: string;
  name: string;
};

// Simple text input.
export const TextInput = (props: Props) => {
  const { label, name } = props;

  const text = useSignal("");
  const { formId, setError, clearError, error } = useSField(name, text);

  // Validation example.
  useSignalEffect(() => {
    if (text.value === "error") {
      // set error on some condition.
      setError("error is error :(");
    } else {
      // or clear error otherwise.
      clearError();
    }
  });

  return (
    <label className={cx("mb-2", error && "text-red-500")}>
      <span className="mr-2">{label}:</span>

      <input
        className="p-1 border rounded"
        type="text"
        form={formId}
        onChange={(e) => {
          text.value = e.target.value;
        }}
        value={text.value}
      />

      {error && <p className="font-bold">{error}</p>}
    </label>
  );
};
