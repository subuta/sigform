import { sigfield } from "../src";
import React from "react";

export const TextInput = sigfield<{ testId?: string }, string>((props, ref) => {
  const { name, setValue, value, testId, helpers, error, ...rest } = props;

  return (
    <div className="p-4 bg-red-400" ref={ref}>
      <input
        name={name}
        type="text"
        data-testid={testId}
        onChange={(e) => {
          const value = e.target.value;
          setValue(value);
          if (value === "invalid") {
            helpers?.setFieldError("invalid value");
          }
        }}
        value={value}
        {...rest}
      />

      {error && <span data-testid={`${testId}:error`}>{error}</span>}
    </div>
  );
});
