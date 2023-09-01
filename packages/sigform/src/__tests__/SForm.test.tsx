import { TextInput } from "../../fixtures/TextInput";
import { SForm, SFormConsumerProps, SFormSubmit } from "@/SForm";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import invariant from "tiny-invariant";

const getOnSubmitData = (onSubmit: jest.Mock) => {
  const args = onSubmit.mock.calls[0];
  return args[0];
};

describe("SForm", () => {
  describe("initialValue", () => {
    it("should reject no initialValue on strict mode", async () => {
      expect(() => {
        const { container } = render(
          <SForm initialData={{}} strict>
            <TextInput name="text" />
          </SForm>,
        );
      }).toThrow("Invariant failed: text not found in initialData");
    });

    it("should defaults to empty value", async () => {
      const { container } = render(
        <SForm initialData={{}}>
          <TextInput name="text" />
        </SForm>,
      );

      const input = container.querySelector(`input[name="text"]`);

      expect(input).toHaveValue("");
    });

    it("should apply initialValue", async () => {
      const { container } = render(
        <SForm initialData={{ text: "hello" }}>
          <TextInput name="text" />
        </SForm>,
      );

      const input = container.querySelector(`input[name="text"]`);

      expect(input).toHaveValue("hello");
    });
  });

  describe("defaultValue", () => {
    it("should apply defaultValue if defined", async () => {
      const { container } = render(
        <SForm initialData={{}}>
          <TextInput name="text" defaultValue="world" />
        </SForm>,
      );

      const input = container.querySelector(`input[name="text"]`);

      expect(input).toHaveValue("world");
    });
  });

  describe("clearValue", () => {
    it("should apply clearValue if defined on reset", async () => {
      const { container } = render(
        <SForm
          initialData={{ text: "world" }}
          onSubmit={(data, { reset }) => {
            reset();
          }}
        >
          <TextInput name="text" clearValue="cleared" />
        </SForm>,
      );

      const input = container.querySelector(`input[name="text"]`);
      const form = container.querySelector(`form`);

      invariant(input, "must exists");
      invariant(form, "must exists");

      fireEvent.change(input, { target: { value: "world" } });
      fireEvent.submit(form);

      expect(input).toHaveValue("cleared");
    });
  });

  describe("onChange", () => {
    it("should pass modified value", async () => {
      const onSubmit = jest.fn();

      const { container } = render(
        <SForm onSubmit={onSubmit} initialData={{ text: "hello" }}>
          <TextInput name="text" />
          <SFormSubmit />
        </SForm>,
      );

      const input = container.querySelector(`input[name="text"]`);
      const form = container.querySelector(`form`);

      invariant(input, "must exists");
      invariant(form, "must exists");

      fireEvent.change(input, { target: { value: "world" } });
      fireEvent.submit(form);

      expect(input).toHaveValue("world");

      expect(onSubmit).toHaveBeenCalled();
      expect(getOnSubmitData(onSubmit)).toEqual({ text: "world" });
    });
  });

  describe("error", () => {
    it("setError should reflect error to field", async () => {
      const onSubmit = jest.fn(((data, helpers) => {
        helpers.setFormErrors({ text: "must be world" });
      }) as SFormConsumerProps["onSubmit"]);

      const { container } = render(
        <SForm onSubmit={onSubmit} initialData={{ text: "hello" }}>
          <TextInput name="text" />
          <SFormSubmit />
        </SForm>,
      );

      const input = container.querySelector(`input[name="text"]`);
      const form = container.querySelector(`form`);

      invariant(input, "must exists");
      invariant(form, "must exists");

      fireEvent.change(input, { target: { value: "world" } });
      fireEvent.submit(form);

      const error = screen.getByTestId("error");
      invariant(error, "must exists");

      expect(input).toHaveValue("world");
      expect(error).toHaveTextContent("must be world");

      expect(onSubmit).toHaveBeenCalled();
      expect(getOnSubmitData(onSubmit)).toEqual({ text: "world" });
    });
  });
});
