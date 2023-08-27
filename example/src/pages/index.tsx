import { SForm } from "sigform";
import { ComposedInputNext } from "@/components/ComposedInputNext";

export default function Index() {
  return (
    <div className="p-4">
      <SForm
        onSubmit={(data, { reset }) => {
          console.log("submit!", data);
          // reset();
        }}
        initialData={{
          composed: "123-456-789",
        }}
      >
        <ComposedInputNext name="composed" />

        <SForm.Submit className="mt-4 p-1 border rounded">submit</SForm.Submit>
      </SForm>
    </div>
  );
}
