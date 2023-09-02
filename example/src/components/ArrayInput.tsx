import { TextInput } from "@/components/TextInput";
import { v4 as uuid } from "@lukeed/uuid";
import React, { useCallback } from "react";
import { useSArrayField } from "sigform";

export type Row = {
  key: string;
  text: string;
};

export const getNewRow = (text: string) => ({ key: uuid(), text });

export const ArrayInput = (props: { name: string }) => {
  const { name } = props;

  const [array] = useSArrayField<Row>(name, {
    clearValue: [],
  });

  return (
    <div>
      <div className="flex flex-col">
        {array.dump().map(
          useCallback((row, i) => {
            const { key } = row;

            return (
              <div key={key}>
                <input type="hidden" name={`${name}.${i}.key`} value={key} />

                <TextInput label={String(i)} name={`${name}.${i}.text`} />

                <button
                  className="ml-1 p-1 rounded text-lg"
                  onClick={() => array.splice(i, 1)}
                >
                  -
                </button>
              </div>
            );
          }, []),
        )}
      </div>

      <button
        className="ml-1 p-1 rounded text-lg"
        onClick={() => array.push(getNewRow(""))}
      >
        +
      </button>
    </div>
  );
};
