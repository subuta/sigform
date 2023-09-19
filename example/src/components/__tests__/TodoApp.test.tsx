import { TodoApp } from "@/components/TodoApp";
import { jest } from "@jest/globals";
import "@testing-library/jest-dom";
import {
  fireEvent,
  getByTestId,
  render,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { SigForm } from "sigform";

const dataOfMockCall = (fn: jest.Mock | undefined, nth: number) => {
  if (!fn) return null;
  const args = fn.mock.calls[nth - 1];
  return args[0];
};

export const nextTick = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

const waitNextTick = () => waitFor(() => nextTick());

describe("TodoApp", () => {
  it("should handle complex remove + add combination", async () => {
    const onChange = jest.fn();

    const { container } = render(
      <SigForm onChange={onChange}>
        <TodoApp name="todos" defaultValue={[{ id: 1, task: "buy egg" }]} />
      </SigForm>,
    );

    await waitNextTick();

    let input = getByTestId(container, "input:1");
    expect(input).toHaveValue("buy egg");

    const removeButton = getByTestId(container, "button:1:remove");
    fireEvent.click(removeButton);

    const appendButton = getByTestId(container, "button:append");
    fireEvent.click(appendButton);

    input = getByTestId(container, "input:1");
    expect(input).toHaveValue("");

    fireEvent.change(input, { target: { value: "hello" } });

    fireEvent.click(appendButton);

    fireEvent.change(input, { target: { value: "world" } });

    expect(onChange).toHaveBeenCalledTimes(6);
    expect(dataOfMockCall(onChange, 1)).toEqual({
      todos: [{ id: 1, task: "buy egg" }],
    });

    expect(dataOfMockCall(onChange, 2)).toEqual({ todos: [] });
    expect(dataOfMockCall(onChange, 3)).toEqual({
      todos: [{ id: 1, task: "" }],
    });
    expect(dataOfMockCall(onChange, 4)).toEqual({
      todos: [{ id: 1, task: "hello" }],
    });
    expect(dataOfMockCall(onChange, 5)).toEqual({
      todos: [
        { id: 1, task: "hello" },
        { id: 2, task: "" },
      ],
    });

    expect(dataOfMockCall(onChange, 6)).toEqual({
      todos: [
        { id: 1, task: "world" },
        { id: 2, task: "" },
      ],
    });
  });

  it("should handle complex remove + add combination, variation", async () => {
    const onChange = jest.fn();

    const { container } = render(
      <SigForm onChange={onChange}>
        <TodoApp name="todos" defaultValue={[{ id: 1, task: "buy egg" }]} />
      </SigForm>,
    );

    await waitNextTick();

    let input = getByTestId(container, "input:1");
    expect(input).toHaveValue("buy egg");

    expect(dataOfMockCall(onChange, 1)).toEqual({
      todos: [{ id: 1, task: "buy egg" }],
    });

    const appendButton = getByTestId(container, "button:append");
    fireEvent.click(appendButton);

    expect(dataOfMockCall(onChange, 2)).toEqual({
      todos: [
        { id: 1, task: "buy egg" },
        { id: 2, task: "" },
      ],
    });

    input = getByTestId(container, "input:2");
    expect(input).toHaveValue("");

    fireEvent.change(input, { target: { value: "hello" } });

    expect(dataOfMockCall(onChange, 3)).toEqual({
      todos: [
        { id: 1, task: "buy egg" },
        { id: 2, task: "hello" },
      ],
    });

    fireEvent.click(appendButton);

    expect(onChange).toHaveBeenCalledTimes(4);
    expect(dataOfMockCall(onChange, 4)).toEqual({
      todos: [
        { id: 1, task: "buy egg" },
        { id: 2, task: "hello" },
        { id: 3, task: "" },
      ],
    });
  });

  it("should handle complex remove + add combination with Raw component", async () => {
    const onChange = jest.fn();

    const { container } = render(
      <TodoApp.Raw onChange={onChange} value={[{ id: 1, task: "buy egg" }]} />,
    );

    await waitNextTick();

    let input = getByTestId(container, "input:1");
    expect(input).toHaveValue("buy egg");

    expect(dataOfMockCall(onChange, 1)).toEqual([{ id: 1, task: "buy egg" }]);

    const appendButton = getByTestId(container, "button:append");
    fireEvent.click(appendButton);

    expect(dataOfMockCall(onChange, 2)).toEqual([
      { id: 1, task: "buy egg" },
      { id: 2, task: "" },
    ]);

    input = getByTestId(container, "input:2");
    expect(input).toHaveValue("");

    fireEvent.change(input, { target: { value: "hello" } });

    expect(dataOfMockCall(onChange, 3)).toEqual([
      { id: 1, task: "buy egg" },
      { id: 2, task: "hello" },
    ]);

    fireEvent.click(appendButton);

    expect(onChange).toHaveBeenCalledTimes(4);
    expect(dataOfMockCall(onChange, 4)).toEqual([
      { id: 1, task: "buy egg" },
      { id: 2, task: "hello" },
      { id: 3, task: "" },
    ]);
  });

  it("should work with form error", async () => {
    const onChange = jest.fn();

    const { container } = render(
      <SigForm
        onChange={(data, helpers) => {
          const firstTodo = data.todos[0];
          onChange(data);
          if (firstTodo && firstTodo.task === "invalid") {
            helpers.setFormErrors({
              todos: ["some error"],
            });
          }
        }}
      >
        <TodoApp name="todos" defaultValue={[{ id: 1, task: "buy egg" }]} />
      </SigForm>,
    );

    await waitNextTick();

    let input = getByTestId(container, "input:1");
    expect(input).toHaveValue("buy egg");

    expect(dataOfMockCall(onChange, 1)).toEqual({
      todos: [{ id: 1, task: "buy egg" }],
    });

    input = getByTestId(container, "input:1");
    fireEvent.change(input, { target: { value: "invalid" } });
    expect(input).toHaveValue("invalid");

    expect(dataOfMockCall(onChange, 1)).toEqual({
      todos: [{ id: 1, task: "buy egg" }],
    });

    expect(dataOfMockCall(onChange, 2)).toEqual({
      todos: [{ id: 1, task: "invalid" }],
    });
    const error = getByTestId(container, "input:1:error");
    expect(error.innerText).toEqual("some error");

    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
