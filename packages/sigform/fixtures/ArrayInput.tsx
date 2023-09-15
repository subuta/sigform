import { sigfield } from "../src";
import { TextInput } from "./TextInput";
import React from "react";

type Data = {
  id: string;
  value: string;
};
export const ArrayInput = sigfield<{}, Data[]>((props, ref) => {
  const { field } = props;

  // console.log(field.value);

  return (
    <div className="p-4 bg-blue-400" ref={ref}>
      {field.value.map((data, i) => {
        return (
          <React.Fragment key={data.id}>
            <TextInput name={`${i}.value`} defaultValue={data.value} />
            <button
              type="button"
              id={`${i}-remove`}
              onClick={() => {
                field.value = field.value.filter((str) => str !== data);
              }}
            >
              remove
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
});
