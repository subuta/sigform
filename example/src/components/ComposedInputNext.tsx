import { TextInput } from "@/components/TextInput";
import { untracked, useSignal, useSignalEffect } from "@preact/signals-react";
import { SForm, SFormContext, useSField } from "sigform";

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

// Complex composed input example.
export const ComposedInputNext = (props: Props) => {
  const { name } = props;

  const composed = useSignal("");
  const { defaultValue } = useSField(name, composed);

  return (
    <SForm initialData={parse(defaultValue || "")}>
      {() => {
        // With "renderless component" (`<SForm>{() => {}]</SForm>`) syntax, you can access nested fields in here.
        const { watchData, reset } = SFormContext.useContainer();

        // Join 3 input results.
        const joined = watchData((data): string => {
          return [data.first, data.second, data.third].join("-");
        });

        useSignalEffect(() => {
          // Broadcast joined value into parent.
          composed.value = joined.value;
        });

        useSignalEffect(() => {
          // Broadcast "reset" changes to nested forms.
          if (!composed.value) {
            reset();
          }
        });

        return (
          <div className="flex flex-col items-start">
            {/* You can nest other input(field) as below */}
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
