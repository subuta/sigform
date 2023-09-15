import { sigfield } from "../src";
import { TextInput } from "./TextInput";
import React from "react";

type Data = {
  propA: string;
};
export const ObjectInput = sigfield<{}, Data>((props, ref) => {
  const { name, field } = props;

  return (
    <div className="p-4 bg-blue-400" ref={ref}>
      <TextInput name="propA" defaultValue={field.value.propA} />
    </div>
  );
});
