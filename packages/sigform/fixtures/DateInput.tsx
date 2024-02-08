import { sigfield } from "../src";
import cx from "classnames";
import React from "react";
import invariant from "tiny-invariant";

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
>((props) => {
  const { setValue, value: rawValue, className = "", testId } = props;

  let value = "";
  if (rawValue instanceof Date && !isInvalidDate(rawValue)) {
    value = getJaDate(rawValue);
  }

  return (
    <input
      className={cx("px-2 py-1 border rounded h-[34px]", className)}
      data-testid={testId}
      type="date"
      onChange={(e) => {
        const value = e.target.value;
        if (value) {
          const date = parseDate(value);
          invariant(date, "must exists");
          setValue(date);
        } else {
          setValue(null);
        }
      }}
      value={value}
    />
  );
});
