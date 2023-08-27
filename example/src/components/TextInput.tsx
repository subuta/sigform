import { useSignal, useSignalEffect, useNField } from "sigform";
import cx from "classnames";

type Props = {
  label: string;
  name: string;
};

export const TextInput = (props: Props) => {
  const { label, name } = props;

  const text = useSignal("");
  const { formId, setError, clearError, error } = useNField(name, text);

  useSignalEffect(() => {
    if (text.value === "error") {
      setError("error is error :(");
    } else {
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
