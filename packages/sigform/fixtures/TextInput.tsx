import { sigfield } from "../src";
import React from "react";

export const TextInput = sigfield<{ testId?: string }, string>((props, ref) => {
  const { name, field, testId } = props;

  // console.log(name, field.value);

  return (
    <div className="p-4 bg-red-400" ref={ref}>
      <input
        name={name}
        type="text"
        data-testid={testId}
        onChange={(e) => (field.value = e.target.value)}
        value={field.value}
      />
    </div>
  );
});
