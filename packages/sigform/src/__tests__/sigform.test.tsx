import { SigForm } from "@/..";
import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";
import { ArrayInput } from "fixtures/ArrayInput";
import { ObjectInput } from "fixtures/ObjectInput";
import { TextInput } from "fixtures/TextInput";
import React from "react";
import invariant from "tiny-invariant";

const nextTick = () => new Promise((resolve) => requestAnimationFrame(resolve));

const getHandlerData = (fn: jest.Mock | undefined, nth: number) => {
  if (!fn) return null;
  const args = fn.mock.calls[nth - 1];
  return args[0];
};

describe("sigform", () => {
  describe("defaultValue", () => {
    it("should handle defaultValue", async () => {
      const { container } = render(
        <SigForm>
          <TextInput name="text" defaultValue="hello" />
        </SigForm>,
      );

      await nextTick();

      const input = container.querySelector(`input[name="text"]`);

      expect(input).toHaveValue("hello");
    });

    it("should handle object defaultValue", () => {
      const { container } = render(
        <SigForm>
          <ObjectInput name="obj" defaultValue={{ propA: "world" }} />
        </SigForm>,
      );

      const input = container.querySelector(`input[name="propA"]`);

      expect(input).toHaveValue("world");
    });

    it("should handle array defaultValue", () => {
      const { container } = render(
        <SigForm>
          <ArrayInput
            name="array"
            defaultValue={[{ id: "1", value: "hoge" }]}
          />
        </SigForm>,
      );

      const input = container.querySelector(`input[name="0.value"]`);

      expect(input).toHaveValue("hoge");
    });
  });

  describe("onChange & onSubmit", () => {
    let onChange: jest.Mock;
    let onSubmit: jest.Mock;

    // Setup event handlers.
    beforeEach(() => {
      onChange = jest.fn(() => {});
      onSubmit = jest.fn(() => {});
    });

    it("should handle string input", async () => {
      const { container } = render(
        <SigForm onChange={onChange} onSubmit={onSubmit}>
          <TextInput name="text" defaultValue="hello" />

          <button type="submit">submit</button>
        </SigForm>,
      );

      await nextTick();

      const input = container.querySelector(`input[name="text"]`);
      invariant(input, "must exists");

      const form = container.querySelector(`form`);
      invariant(form, "must exists");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(getHandlerData(onChange, 1)).toEqual({ text: "hello" });

      fireEvent.change(input, { target: { value: "world" } });
      expect(input).toHaveValue("world");

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(getHandlerData(onChange, 2)).toEqual({ text: "world" });

      fireEvent.submit(form);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(getHandlerData(onSubmit, 1)).toEqual({ text: "world" });
    });

    it("should handle array input", async () => {
      const { container } = render(
        <SigForm onChange={onChange} onSubmit={onSubmit}>
          <ArrayInput
            name="array"
            defaultValue={[
              { id: "1", value: "hello" },
              { id: "2", value: "world" },
            ]}
          />

          <button type="submit">submit</button>
        </SigForm>,
      );

      await nextTick();

      let firstInput = container.querySelector(`input[name="0.value"]`);
      invariant(firstInput, "must exists");

      const form = container.querySelector(`form`);
      invariant(form, "must exists");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(getHandlerData(onChange, 1)).toEqual({
        array: [
          { id: "1", value: "hello" },
          { id: "2", value: "world" },
        ],
      });

      fireEvent.change(firstInput, { target: { value: "goodbye" } });
      expect(firstInput).toHaveValue("goodbye");

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(getHandlerData(onChange, 2)).toEqual({
        array: [
          { id: "1", value: "goodbye" },
          { id: "2", value: "world" },
        ],
      });

      fireEvent.submit(form);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(getHandlerData(onSubmit, 1)).toEqual({
        array: [
          { id: "1", value: "goodbye" },
          { id: "2", value: "world" },
        ],
      });

      const removeButton = container.querySelector("#0-remove");
      invariant(removeButton, "must exists");

      // Second input must be removed.
      let secondInput = container.querySelector(`input[name="1.value"]`);
      expect(secondInput).not.toBeNull();

      fireEvent.click(removeButton);

      firstInput = container.querySelector(`input[name="0.value"]`);
      invariant(firstInput, "must exists");
      expect(firstInput).toHaveValue("world");

      // Second input must be removed.
      secondInput = container.querySelector(`input[name="1.value"]`);
      expect(secondInput).toBeNull();

      // Array data must be in sync.
      expect(onChange).toHaveBeenCalledTimes(3);
      expect(getHandlerData(onChange, 3)).toEqual({
        array: [{ id: "2", value: "world" }],
      });

      fireEvent.submit(form);

      expect(onSubmit).toHaveBeenCalledTimes(2);
      expect(getHandlerData(onSubmit, 2)).toEqual({
        array: [{ id: "2", value: "world" }],
      });
    });

    it("should handle object input", async () => {
      const { container } = render(
        <SigForm onChange={onChange} onSubmit={onSubmit}>
          <ObjectInput name="obj" defaultValue={{ propA: "hello" }} />

          <button type="submit">submit</button>
        </SigForm>,
      );

      await nextTick();

      const input = container.querySelector(`input[name="propA"]`);
      invariant(input, "must exists");

      const form = container.querySelector(`form`);
      invariant(form, "must exists");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(getHandlerData(onChange, 1)).toEqual({ obj: { propA: "hello" } });

      fireEvent.change(input, { target: { value: "world" } });
      expect(input).toHaveValue("world");

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(getHandlerData(onChange, 2)).toEqual({ obj: { propA: "world" } });

      fireEvent.submit(form);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(getHandlerData(onSubmit, 1)).toEqual({ obj: { propA: "world" } });
    });
  });
});
