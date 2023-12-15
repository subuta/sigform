import { sigfield } from "../src";
import { TextInput } from "./TextInput";
import React from "react";

type Data = {
  id: string;
  value: string;
};
export const ArrayInput = sigfield<{}, Data[]>((props, ref) => {
  const { mutate } = props;

  const array = props.value;

  return (
    <div className="p-4 bg-blue-400" ref={ref}>
      {array.map((data, i) => {
        return (
          <React.Fragment key={data.id}>
            <TextInput.Raw
              testId={`input:${data.id}`}
              onChange={(value) => {
                mutate((draft) => {
                  draft[i].value = value;
                });
              }}
              value={data.value}
            />
            <button
              type="button"
              data-testId={`remove:${data.id}`}
              onClick={() => {
                mutate((draft) => {
                  return draft.filter((d) => d.id !== data.id);
                });
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
