import { sigfield } from "../src";
import React from "react";

export const CheckboxInput = sigfield<{ testId?: string }, boolean>((props) => {
  const { setValue, value, testId, defaultValue, ...rest } = props;

  return (
    <div className="p-4 bg-red-400">
      <input
        type="checkbox"
        data-testid={testId}
        onClick={(e) => setValue(e.currentTarget.checked)}
        checked={value}
        defaultChecked={defaultValue}
        {...rest}
      />
    </div>
  );
});
