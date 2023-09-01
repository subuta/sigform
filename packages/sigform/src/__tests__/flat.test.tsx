import { TextInput } from "../../fixtures/TextInput";
import { SForm } from "@/SForm";
import { effect, signal } from "@preact/signals-react";
import "@testing-library/jest-dom";
import { createEvent, fireEvent, render } from "@testing-library/react";
import { flatten } from "flat";
import React from "react";
import invariant from "tiny-invariant";

describe("SForm", () => {
  describe("flat", () => {
    it("should handle flat initialValue", () => {
      const { container } = render(
        <SForm initialData={{ text: "hello" }}>
          <TextInput name="text" />
        </SForm>,
      );

      const input = container.querySelector(`input[name="text"]`);

      expect(input).toHaveValue("hello");
    });

    it("should handle nested initialValue", () => {
      const { container } = render(
        <SForm initialData={{ hoge: { fuga: "piyo" } }}>
          <TextInput name="hoge.fuga" />
        </SForm>,
      );

      const input = container.querySelector(`input[name="hoge.fuga"]`);

      expect(input).toHaveValue("piyo");
    });

    // it("should handle array initialValue", () => {
    //   const { container } = render(
    //     <SForm initialData={{ array: ["hello"] }}>
    //       <TextInput name="array.0" />
    //     </SForm>,
    //   );
    //
    //   const input = container.querySelector(`input[name="array.0"]`);
    //
    //   expect(input).toHaveValue("hello");
    // });
    //
    // it("should handle array + object initialValue", () => {
    //   const { container } = render(
    //     <SForm initialData={{ array: [{ text: "world" }] }}>
    //       <TextInput name="array.0.text" />
    //     </SForm>,
    //   );
    //
    //   const input = container.querySelector(`input[name="array.0.text"]`);
    //
    //   expect(input).toHaveValue("world");
    // });
  });
});
