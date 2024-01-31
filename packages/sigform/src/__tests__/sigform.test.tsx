import { CheckboxInput } from "../../fixtures/CheckboxInput";
import { DateInput } from "../../fixtures/DateInput";
import { TextInput } from "../../fixtures/TextInput";
import { SigForm } from "../sigform";
import { nextTick } from "../util";
import { jest } from "@jest/globals";
import "@testing-library/jest-dom";
import {
  fireEvent,
  getByTestId,
  queryByTestId,
  render,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { ArrayInput } from "sigform/fixtures/ArrayInput";
import { ObjectInput } from "sigform/fixtures/ObjectInput";
import invariant from "tiny-invariant";

const waitNextTick = () => waitFor(() => nextTick());

const dataOfMockCall = (fn: jest.Mock | undefined, nth: number) => {
  if (!fn) return null;
  const args = fn.mock.calls[nth - 1];
  return args[0];
};

const allDataOfMockCall = (fn: jest.Mock | undefined, nth: number) => {
  if (!fn) return null;
  return fn.mock.calls[nth - 1];
};

describe("sigform", () => {
  describe("defaultValue", () => {
    it("should handle defaultValue", async () => {
      const { container } = render(
        <SigForm>
          <TextInput name="text" defaultValue="hello" />,
        </SigForm>,
      );

      await waitNextTick();

      const input = container.querySelector(`input[name="text"]`);

      expect(input).toHaveValue("hello");
    });

    it("should handle boolean defaultValue", async () => {
      const { container } = render(
        <SigForm>
          <CheckboxInput name="bool" defaultValue={true} />,
        </SigForm>,
      );

      await waitNextTick();

      const input = container.querySelector(`input[name="bool"]`);

      expect(input).toBeChecked();
    });

    it("should handle object defaultValue", async () => {
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

      const input = getByTestId(container, "input:1");

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

      await waitNextTick();

      const input = container.querySelector(`input[name="text"]`);
      invariant(input, "must exists");
      expect(input).toHaveValue("hello");

      const form = container.querySelector(`form`);
      invariant(form, "must exists");

      fireEvent.change(input, { target: { value: "world" } });
      expect(input).toHaveValue("world");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(dataOfMockCall(onChange, 1)).toEqual({ text: "world" });
    });

    it("should handle nested string input", async () => {
      const { container } = render(
        <SigForm onChange={onChange} onSubmit={onSubmit}>
          <TextInput name="nested.text" defaultValue="world" />
          <TextInput name="text" defaultValue="hello" />

          <button type="submit">submit</button>
        </SigForm>,
      );

      await waitNextTick();

      const input = container.querySelector(`input[name="nested.text"]`);
      invariant(input, "must exists");
      expect(input).toHaveValue("world");

      const form = container.querySelector(`form`);
      invariant(form, "must exists");

      fireEvent.change(input, { target: { value: "world2" } });
      expect(input).toHaveValue("world2");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(dataOfMockCall(onChange, 1)).toEqual({
        nested: { text: "world2" },
        text: "hello",
      });
    });

    it("should handle boolean defaultValue", async () => {
      const { container } = render(
        <CheckboxInput.Raw testId="bool" defaultValue={true} />,
      );

      await waitNextTick();

      const input = getByTestId(container, "bool");

      expect(input).toBeChecked();
      invariant(input, "must exists");

      fireEvent.click(input);
      expect(input).not.toBeChecked();
    });

    it("should handle boolean defaultValue", async () => {
      const { container } = render(
        <SigForm>
          <CheckboxInput name="bool" defaultValue={false} />,
        </SigForm>,
      );

      await waitNextTick();

      const input = container.querySelector(`input[name="bool"]`);

      expect(input).not.toBeChecked();
      invariant(input, "must exists");

      fireEvent.click(input);
      expect(input).toBeChecked();
    });

    it("should handle Raw", async () => {
      const { container } = render(
        <TextInput.Raw
          testId="input"
          onChange={onChange}
          defaultValue="hello"
        />,
      );

      await waitNextTick();

      const input = getByTestId(container, "input");
      invariant(input, "must exists");

      fireEvent.change(input, { target: { value: "world" } });
      expect(input).toHaveValue("world");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(allDataOfMockCall(onChange, 1)).toEqual([
        "world",
        [{ op: "replace", path: [], value: "world" }],
      ]);
    });

    it("should handle Raw with name", async () => {
      const { container } = render(
        <TextInput.Raw name="text" onChange={onChange} defaultValue="hello" />,
      );

      await waitNextTick();

      const input = container.querySelector(`input[name="text"]`);
      invariant(input, "must exists");

      fireEvent.change(input, { target: { value: "world" } });
      expect(input).toHaveValue("world");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(allDataOfMockCall(onChange, 1)).toEqual([
        "world",
        [{ op: "replace", path: ["text"], value: "world" }],
      ]);
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

      await waitNextTick();

      let firstInput = getByTestId(container, "input:1");

      const form = container.querySelector(`form`);
      invariant(form, "must exists");

      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.change(firstInput, { target: { value: "goodbye" } });
      expect(firstInput).toHaveValue("goodbye");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(dataOfMockCall(onChange, 1)).toEqual({
        array: [
          { id: "1", value: "goodbye" },
          { id: "2", value: "world" },
        ],
      });

      fireEvent.submit(form);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(dataOfMockCall(onSubmit, 1)).toEqual({
        array: [
          { id: "1", value: "goodbye" },
          { id: "2", value: "world" },
        ],
      });

      const removeButton = getByTestId(container, "remove:1");

      // Second input must be removed.
      let secondInput = getByTestId(container, "input:2");
      expect(secondInput).not.toBeNull();

      fireEvent.click(removeButton);

      firstInput = getByTestId(container, "input:2");
      invariant(firstInput, "must exists");
      expect(firstInput).toHaveValue("world");

      // Second input must be removed.
      expect(queryByTestId(container, "input:1")).toBeNull();

      // Array data must be in sync.
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(dataOfMockCall(onChange, 2)).toEqual({
        array: [{ id: "2", value: "world" }],
      });

      fireEvent.submit(form);

      expect(onSubmit).toHaveBeenCalledTimes(2);
      expect(dataOfMockCall(onSubmit, 2)).toEqual({
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

      await waitNextTick();

      const input = container.querySelector(`input[name="propA"]`);
      invariant(input, "must exists");

      const form = container.querySelector(`form`);
      invariant(form, "must exists");

      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.change(input, { target: { value: "world" } });
      expect(onChange).toHaveBeenCalledTimes(1);

      expect(input).toHaveValue("world");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(dataOfMockCall(onChange, 1)).toEqual({ obj: { propA: "world" } });

      fireEvent.submit(form);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(dataOfMockCall(onSubmit, 1)).toEqual({ obj: { propA: "world" } });
    });
  });

  describe("issues", () => {
    let onChange: jest.Mock;
    let onSubmit: jest.Mock;

    // Setup event handlers.
    beforeEach(() => {
      onChange = jest.fn(() => {});
      onSubmit = jest.fn(() => {});
    });

    it("should handle date input", async () => {
      const { container } = render(
        <SigForm onChange={onChange} onSubmit={onSubmit}>
          <DateInput name="date" defaultValue={new Date()} />

          <button type="submit">submit</button>
        </SigForm>,
      );

      await waitNextTick();

      const input = container.querySelector(`input[name="date"]`);
      invariant(input, "must exists");

      expect(onChange).toHaveBeenCalledTimes(0);

      fireEvent.change(input, { target: { value: "2023-12-01" } });
      expect(onChange).toHaveBeenCalledTimes(1);

      expect(input).toHaveValue("2023-12-01");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(dataOfMockCall(onChange, 1)).toEqual({
        date: expect.any(Date),
      });

      fireEvent.change(input, { target: { value: "" } });
      expect(onChange).toHaveBeenCalledTimes(2);

      expect(input).toHaveValue("");

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(dataOfMockCall(onChange, 2)).toEqual({
        date: null,
      });
    });
  });
});
