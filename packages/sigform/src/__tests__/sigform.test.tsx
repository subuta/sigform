import { CheckboxInput } from "../../fixtures/CheckboxInput";
import { DateInput } from "../../fixtures/DateInput";
import { TextInput } from "../../fixtures/TextInput";
import { SigFormHelpers } from "../context";
import { SigForm } from "../sigform";
import { jest } from "@jest/globals";
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  getByTestId,
  queryByTestId,
  render,
} from "@testing-library/react";
import React from "react";
import { ArrayInput } from "sigform/fixtures/ArrayInput";
import { ObjectInput } from "sigform/fixtures/ObjectInput";
import invariant from "tiny-invariant";

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
          <TextInput testId="text" name="text" defaultValue="hello" />
        </SigForm>,
      );

      const input = getByTestId(container, "text");

      expect(input).toHaveValue("hello");
    });

    it("should handle boolean defaultValue", async () => {
      const { container } = render(
        <SigForm>
          <CheckboxInput name="bool" testId="bool" defaultValue={true} />,
        </SigForm>,
      );

      const input = getByTestId(container, "bool");

      expect(input).toBeChecked();
    });

    it("should handle object defaultValue", async () => {
      const { container } = render(
        <SigForm>
          <ObjectInput name="obj" defaultValue={{ propA: "world" }} />
        </SigForm>,
      );

      const input = getByTestId(container, "propA");

      expect(input).toHaveValue("world");
    });

    it("should handle array defaultValue", async () => {
      const { container } = render(
        <SigForm>
          <ArrayInput
            name="input"
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
          <TextInput testId="text" name="text" defaultValue="hello" />

          <button type="submit">submit</button>
        </SigForm>,
      );

      const input = getByTestId(container, "text");
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
          <TextInput
            testId="nested.text"
            name="nested.text"
            defaultValue="world"
          />
          <TextInput testId="text" name="text" defaultValue="hello" />

          <button type="submit">submit</button>
        </SigForm>,
      );

      const input = getByTestId(container, "nested.text");
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
        <SigForm>
          <CheckboxInput testId="bool" name="bool" defaultValue={false} />,
        </SigForm>,
      );

      const input = getByTestId(container, "bool");

      expect(input).not.toBeChecked();
      invariant(input, "must exists");

      fireEvent.click(input);

      expect(input).toBeChecked();
    });

    it("should handle boolean defaultValue with Raw", async () => {
      const { container } = render(
        <CheckboxInput.Raw testId="bool" defaultValue={true} />,
      );

      const input = getByTestId(container, "bool");

      expect(input).toBeChecked();
      invariant(input, "must exists");

      fireEvent.click(input);

      expect(input).not.toBeChecked();
    });

    it("should handle Raw", async () => {
      const { container } = render(
        <TextInput.Raw
          testId="input"
          onChange={onChange}
          defaultValue="hello"
        />,
      );

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
        <TextInput.Raw
          testId="text"
          onChange={onChange}
          defaultValue="hello"
        />,
      );

      const input = getByTestId(container, "text");
      invariant(input, "must exists");

      fireEvent.change(input, { target: { value: "world" } });

      expect(input).toHaveValue("world");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(allDataOfMockCall(onChange, 1)).toEqual([
        "world",
        [{ op: "replace", path: [], value: "world" }],
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

      const input = getByTestId(container, "propA");
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

    it("should handle field error", async () => {
      const { container } = render(
        <SigForm onChange={onChange} onSubmit={onSubmit}>
          {(helpers) => {
            return (
              <>
                <TextInput testId="text" name="text" defaultValue="hello" />
                <TextInput testId="text2" name="text2" defaultValue="world" />

                <button type="submit">submit</button>
              </>
            );
          }}
        </SigForm>,
      );

      const input = getByTestId(container, "text");
      invariant(input, "must exists");
      expect(input).toHaveValue("hello");

      fireEvent.change(input, { target: { value: "invalid" } });

      expect(input).toHaveValue("invalid");

      const input2 = getByTestId(container, "text2");
      invariant(input2, "must exists");
      expect(input2).toHaveValue("world");

      fireEvent.change(input2, { target: { value: "invalid" } });
      expect(input2).toHaveValue("invalid");

      const error = getByTestId(container, "text:error");
      invariant(error, "must exists");
      expect(error.textContent).toEqual("invalid value");

      let error2 = getByTestId(container, "text2:error");
      invariant(error2, "must exists");
      expect(error2.textContent).toEqual("invalid value");

      fireEvent.change(input2, { target: { value: "valid" } });
      expect(input2).toHaveValue("valid");

      expect(onChange).toHaveBeenCalledTimes(3);
      expect(dataOfMockCall(onChange, 1)).toEqual({
        text: "invalid",
        text2: "world",
      });
      expect(dataOfMockCall(onChange, 2)).toEqual({
        text: "invalid",
        text2: "invalid",
      });
      expect(dataOfMockCall(onChange, 3)).toEqual({
        text: "invalid",
        text2: "valid",
      });

      expect(queryByTestId(container, "text2:error")).not.toBeInTheDocument();
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
          <DateInput testId="date" name="date" defaultValue={new Date()} />

          <button type="submit">submit</button>
        </SigForm>,
      );

      const input = getByTestId(container, "date");
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

    it("should handle renderProps", async () => {
      const fn = jest.fn((helpers: SigFormHelpers) => {
        return (
          <>
            <TextInput name="text" defaultValue="hello" testId="text" />

            <button type="submit">submit</button>
          </>
        );
      });

      const { container } = render(
        <SigForm onChange={onChange} onSubmit={onSubmit}>
          {fn}
        </SigForm>,
      );

      const input = getByTestId(container, "text");
      invariant(input, "must exists");
      expect(input).toHaveValue("hello");

      const form = container.querySelector(`form`);
      invariant(form, "must exists");

      fireEvent.change(input, { target: { value: "world" } });

      expect(input).toHaveValue("world");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(dataOfMockCall(onChange, 1)).toEqual({ text: "world" });

      // Should have renderProps called with helpers.
      expect(fn).toHaveBeenCalledTimes(4);
      expect(Object.keys(fn.mock.calls[0][0])).toEqual([
        "setFormErrors",
        "clearFormErrors",
        "resetFormValue",
        "setFieldValues",
        "register",
        "root",
      ]);
      expect(fn.mock.calls[3][0]["root"]).toEqual({
        text: "world",
      });
    });

    it("should handle renderProps helpers", async () => {
      let helpers: SigFormHelpers | null = null;

      const fn = jest.fn((_helpers: SigFormHelpers) => {
        helpers = _helpers;

        return (
          <>
            <TextInput name="text" defaultValue="hello" />
            <TextInput name="text2" defaultValue="world" />

            <button type="submit">submit</button>
          </>
        );
      });

      const { container } = render(
        <SigForm onChange={onChange} onSubmit={onSubmit}>
          {fn}
        </SigForm>,
      );

      // Should have renderProps called with helpers.
      expect(fn).toHaveBeenCalledTimes(2);
      expect(Object.keys(fn.mock.calls[0][0])).toEqual([
        "setFormErrors",
        "clearFormErrors",
        "resetFormValue",
        "setFieldValues",
        "register",
        "root",
      ]);
      expect(fn.mock.calls[1][0]["root"]).toEqual({
        text: "hello",
        text2: "world",
      });

      await act(() => {
        helpers!.resetFormValue({
          text: "updated",
          text2: "updated2",
        });
      });

      expect(fn).toHaveBeenCalledTimes(3);
      expect(fn.mock.calls[2][0]["root"]).toEqual({
        text: "updated",
        text2: "updated2",
      });

      await act(() => {
        helpers!.setFieldValues({
          text: "updated3",
        });
      });

      expect(fn).toHaveBeenCalledTimes(4);
      expect(fn.mock.calls[3][0]["root"]).toEqual({
        text: "updated3",
        text2: "updated2",
      });
    });
  });
});
