import { TextInput } from "@/components/TextInput";
import { v4 as uuid } from "@lukeed/uuid";
import { Signal } from "@preact/signals-react";
import React, { useCallback } from "react";
import { DeepSignal, deepSignal, useSField } from "sigform";

export type Row = {
  key: string;
  text: string;
};

const getNewRow = (text: string) => ({ key: uuid(), text });

export const ArrayInput = (props: { name: string }) => {
  const { name } = props;

  const [array] = useSField<DeepSignal<Row>[]>(name, {
    clearValue: [],
  });

  const remove = useCallback((key: string) => {
    array.value = array.value.filter((signal) => {
      const row = signal.toJSON();
      return row.key !== key;
    });
  }, []);

  const add = useCallback(() => {
    array.value = [...array.value, deepSignal(getNewRow(""))];
  }, []);

  return (
    <div>
      <div className="flex flex-col">
        {array.value.map(
          useCallback((signal, i) => {
            const row = signal.toJSON();
            const { key, text } = row;

            return (
              <div key={key}>
                <input type="hidden" name={`${name}.${i}.key`} value={key} />

                <TextInput label={String(i)} name={`${name}.${i}.text`} />

                <button
                  className="ml-1 p-1 rounded text-lg"
                  onClick={() => remove(key)}
                >
                  -
                </button>
              </div>
            );
          }, []),
        )}
      </div>

      <button className="ml-1 p-1 rounded text-lg" onClick={() => add()}>
        +
      </button>
    </div>
  );
};
