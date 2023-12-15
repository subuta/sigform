import { sigfield } from "../src";
import React from "react";

export const CheckboxInput = sigfield<{ testId?: string }, boolean>(
  (props, ref) => {
    const { name, mutate, value, testId, defaultValue, ...rest } = props;

    return (
      <div className="p-4 bg-red-400" ref={ref}>
        <input
          name={name}
          type="checkbox"
          data-testid={testId}
          onClick={(e) => mutate(() => e.currentTarget.checked)}
          checked={value}
          defaultChecked={defaultValue}
          {...rest}
        />
      </div>
    );
  },
);
