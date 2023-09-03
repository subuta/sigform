import { ArrayInput, getNewRow } from "@/components/ArrayInput";
import { ComposedInput } from "@/components/ComposedInput";
import { TextInput } from "@/components/TextInput";
import { SForm, SFormSubmit } from "sigform";

export default function Index() {
  return (
    <div className="p-4">
      <SForm
        onSubmit={(data, { reset }) => {
          console.log("submit!", data);
          // Reset form after submit.
          reset();
        }}
        initialData={{
          composed: "123-456-789",
          array: [getNewRow("")],
          text: "hello world",
        }}
      >
        <ComposedInput name="composed" />

        <hr className="my-4" />

        <ArrayInput name="array" />

        <hr className="my-4" />

        <TextInput label="test" name="text" />

        <hr className="my-4" />

        <SFormSubmit className="mt-4 p-1 border rounded bg-blue-400">
          submit
        </SFormSubmit>
      </SForm>
    </div>
  );
}
