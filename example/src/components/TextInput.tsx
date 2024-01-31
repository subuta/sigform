import cx from "classnames";
import React from "react";
import { sigfield } from "sigform";

// Input field for string type.
export const TextInput = sigfield<
  { className?: string; testId?: string },
  string
>((props, ref) => {
  const { className, value, setValue, error } = props;

  return (
    <div className={cx("relative", error && "pb-6")}>
      <input
        className={cx(
          className,
          "px-2 py-1 border rounded",
          error && "border-red-500",
        )}
        type="text"
        data-testid={props.testId || ""}
        ref={ref}
        onChange={(e) => setValue(e.target.value)}
        value={value}
      />

      {error && (
        <p
          className="position absolute bottom-0 left-0 text-red-500 text-sm font-bold"
          data-testid={props.testId ? `${props.testId}:error` : ""}
        >
          {error}
        </p>
      )}
    </div>
  );
});
