import { sigfield } from "../src";
import React from "react";

export const TextInput = sigfield<{}, string>((props) => {
  const { name, field, dataRef } = props;

  // console.log(name, field.value);

  return (
    <div className="p-4 bg-red-400" ref={dataRef}>
      <input
        name={name}
        type="text"
        onChange={(e) => (field.value = e.target.value)}
        value={field.value}
      />
    </div>
  );
});
