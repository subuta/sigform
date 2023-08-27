import { SForm, SFormContext, useNField } from "sigform";
import { TextInput } from "@/components/TextInput";
import { useSignal, useSignalEffect } from "@preact/signals-react";

type Props = {
  name: string;
};

const parse = (composed: string) => {
  const chunks = composed.split("-");
  if (chunks.length === 3) {
    return {
      first: chunks[0],
      second: chunks[1],
      third: chunks[2],
    };
  }
  return {};
};

export const ComposedInputNext = (props: Props) => {
  const { name } = props;

  const composed = useSignal("");
  const { defaultValue } = useNField(name, composed);

  return (
    <SForm initialData={parse(defaultValue || "")}>
      {() => {
        const { watchData, reset } = SFormContext.useContainer();

        const joined = watchData((data): string => {
          return [data.first, data.second, data.third].join("-");
        });

        useSignalEffect(() => {
          // Apply joined value into parent.
          composed.value = joined.value;
        });

        useSignalEffect(() => {
          reset(parse(composed.value));
        });

        return (
          <div className="flex flex-col items-start">
            <TextInput label="first" name="first" />
            <TextInput label="second" name="second" />
            <TextInput label="third" name="third" />

            <p>joined: {joined}</p>
          </div>
        );
      }}
    </SForm>
  );
};
