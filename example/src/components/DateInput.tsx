import cx from "classnames";
import React from "react";
import { sigfield } from "sigform";

const isInvalidDate = (date: Date) => Number.isNaN(date.getTime());

const getJaDate = (date: Date) =>
  date
    .toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replaceAll("/", "-");

const parseDate = (ymd: string): Date | null => {
  return ymd ? new Date(ymd.replaceAll("-", "/")) : null;
};

export const DateInput = sigfield<
  { testId?: string; className?: string },
  Date | null
>((props, ref) => {
  const { name, setValue, value: rawValue, className = "" } = props;

  let value = "";
  if (rawValue instanceof Date && !isInvalidDate(rawValue)) {
    value = getJaDate(rawValue);
  }

  return (
    <input
      ref={ref}
      className={cx("px-2 py-1 border rounded h-[34px]", className)}
      name={name}
      type="date"
      onChange={(e) => setValue(parseDate(e.target.value))}
      value={value}
    />
  );
});
