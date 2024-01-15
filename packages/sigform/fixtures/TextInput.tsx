import { sigfield } from "../src";
import React from "react";

export const TextInput = sigfield<{ testId?: string }, string>((props, ref) => {
  const { name, setValue, value, testId, ...rest } = props;

  return (
    <div className="p-4 bg-red-400" ref={ref}>
      <input
        name={name}
        type="text"
        data-testid={testId}
        onChange={(e) => setValue(e.target.value)}
        value={value}
        {...rest}
      />
    </div>
  );
});
