import { useSField } from "../src";
import React from "react";

type Props = {
  name: string;
  defaultValue?: string;
  clearValue?: string;
};

export const TextInput = (props: Props) => {
  const { name, defaultValue, clearValue } = props;

  const [text, { error }] = useSField<string>(name, {
    defaultValue,
    clearValue,
  });

  return (
    <>
      {error && <span data-testid="error">{error}</span>}

      <input
        type="text"
        name={name}
        onChange={(e) => {
          text.value = e.target.value;
        }}
        value={text.value}
      />
    </>
  );
};
