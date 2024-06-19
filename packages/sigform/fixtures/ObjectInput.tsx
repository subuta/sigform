import { sigfield } from "../src";
import { TextInput } from "./TextInput";
import React from "react";

type Data = {
  propA: string;
};

export const ObjectInput = sigfield<{}, Data>((props) => {
  const { value, helpers } = props;

  return (
    <div className="p-4 bg-blue-400">
      <TextInput.Raw
        {...helpers?.register("propA", value?.propA, undefined)}
        testId="propA"
      />
    </div>
  );
});
