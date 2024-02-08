import { TodoApp } from "@/components/TodoApp";
import { jest } from "@jest/globals";
import "@testing-library/jest-dom";
import { fireEvent, getByTestId, render } from "@testing-library/react";
import React, { useState } from "react";
import { SigForm } from "sigform";

const dataOfMockCall = (fn: jest.Mock | undefined, nth: number) => {
  if (!fn) return null;
  const args = fn.mock.calls[nth - 1];
  return args[0];
};

export const nextTick = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

describe("TodoApp", () => {
  it("should handle complex remove + add combination", async () => {
    const onChange = jest.fn();

    const { container } = render(
      <SigForm onChange={onChange}>
        {({ register }) => {
          return (
            <TodoApp
              {...register("todos", [
                { id: 1, task: "buy egg", done: false, dueDate: new Date() },
              ])}
            />
          );
        }}
      </SigForm>,
    );

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

    expect(onChange).toHaveBeenCalledTimes(5);

    expect(dataOfMockCall(onChange, 1)).toEqual({ todos: [] });
    expect(dataOfMockCall(onChange, 2)).toEqual({
      todos: [{ id: 1, task: "", done: false, dueDate: expect.any(Date) }],
    });
    expect(dataOfMockCall(onChange, 3)).toEqual({
      todos: [{ id: 1, task: "hello", done: false, dueDate: expect.any(Date) }],
    });
    expect(dataOfMockCall(onChange, 4)).toEqual({
      todos: [
        { id: 1, task: "hello", done: false, dueDate: expect.any(Date) },
        { id: 2, task: "", done: false, dueDate: expect.any(Date) },
      ],
    });

    expect(dataOfMockCall(onChange, 5)).toEqual({
      todos: [
        { id: 1, task: "world", done: false, dueDate: expect.any(Date) },
        { id: 2, task: "", done: false, dueDate: expect.any(Date) },
      ],
    });
  });

  it("should handle complex remove + add combination, default formData", async () => {
    const onSubmit = jest.fn();

    const { container } = render(
      <SigForm onSubmit={onSubmit}>
        {({ register }) => {
          return (
            <>
              <TodoApp
                {...register("todos", [
                  { id: 1, task: "buy egg", done: false, dueDate: new Date() },
                ])}
              />

              <button data-testid="submit">submit</button>
            </>
          );
        }}
      </SigForm>,
    );

    let input = getByTestId(container, "input:1");
    expect(input).toHaveValue("buy egg");

    const submitButton = getByTestId(container, "submit");
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(dataOfMockCall(onSubmit, 1)).toEqual({
      todos: [
        { id: 1, task: "buy egg", done: false, dueDate: expect.any(Date) },
      ],
    });

    const removeButton = getByTestId(container, "button:1:remove");
    fireEvent.click(removeButton);

    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(dataOfMockCall(onSubmit, 2)).toEqual({
      todos: [],
    });

    const appendButton = getByTestId(container, "button:append");
    fireEvent.click(appendButton);

    input = getByTestId(container, "input:1");
    expect(input).toHaveValue("");

    fireEvent.change(input, { target: { value: "hello" } });

    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(3);
    expect(dataOfMockCall(onSubmit, 3)).toEqual({
      todos: [{ id: 1, task: "hello", done: false, dueDate: expect.any(Date) }],
    });
  });

  it("should handle complex remove + add combination, variation", async () => {
    const onChange = jest.fn();

    const { container } = render(
      <SigForm onChange={onChange}>
        {({ register }) => {
          return (
            <TodoApp
              {...register("todos", [
                { id: 1, task: "buy egg", done: false, dueDate: new Date() },
              ])}
            />
          );
        }}
      </SigForm>,
    );

    let input = getByTestId(container, "input:1");
    expect(input).toHaveValue("buy egg");

    const appendButton = getByTestId(container, "button:append");
    fireEvent.click(appendButton);

    expect(dataOfMockCall(onChange, 1)).toEqual({
      todos: [
        { id: 1, task: "buy egg", done: false, dueDate: expect.any(Date) },
        { id: 2, task: "", done: false, dueDate: expect.any(Date) },
      ],
    });

    input = getByTestId(container, "input:2");
    expect(input).toHaveValue("");

    fireEvent.change(input, { target: { value: "hello" } });

    expect(dataOfMockCall(onChange, 2)).toEqual({
      todos: [
        { id: 1, task: "buy egg", done: false, dueDate: expect.any(Date) },
        { id: 2, task: "hello", done: false, dueDate: expect.any(Date) },
      ],
    });

    fireEvent.click(appendButton);

    expect(dataOfMockCall(onChange, 3)).toEqual({
      todos: [
        { id: 1, task: "buy egg", done: false, dueDate: expect.any(Date) },
        { id: 2, task: "hello", done: false, dueDate: expect.any(Date) },
        { id: 3, task: "", done: false, dueDate: expect.any(Date) },
      ],
    });

    fireEvent.change(input, { target: { value: "world" } });

    expect(onChange).toHaveBeenCalledTimes(4);
    expect(dataOfMockCall(onChange, 4)).toEqual({
      todos: [
        { id: 1, task: "buy egg", done: false, dueDate: expect.any(Date) },
        { id: 2, task: "world", done: false, dueDate: expect.any(Date) },
        { id: 3, task: "", done: false, dueDate: expect.any(Date) },
      ],
    });
  });

  it("should handle complex remove + add combination with Raw component", async () => {
    const onChange = jest.fn();

    const TestApp = () => {
      const [todos, setTodos] = useState([
        { id: 1, task: "buy egg", done: false, dueDate: new Date() },
      ]);

      return (
        <TodoApp
          onChange={(...args) => {
            onChange(...args);
            setTodos(args[0]);
          }}
          value={todos}
        />
      );
    };

    const { container } = render(<TestApp />);

    let input = getByTestId(container, "input:1");
    expect(input).toHaveValue("buy egg");

    const appendButton = getByTestId(container, "button:append");
    fireEvent.click(appendButton);

    expect(dataOfMockCall(onChange, 1)).toEqual([
      { id: 1, task: "buy egg", done: false, dueDate: expect.any(Date) },
      { id: 2, task: "", done: false, dueDate: expect.any(Date) },
    ]);

    input = getByTestId(container, "input:2");
    expect(input).toHaveValue("");

    fireEvent.change(input, { target: { value: "hello" } });

    expect(dataOfMockCall(onChange, 2)).toEqual([
      { id: 1, task: "buy egg", done: false, dueDate: expect.any(Date) },
      { id: 2, task: "hello", done: false, dueDate: expect.any(Date) },
    ]);

    fireEvent.click(appendButton);

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(dataOfMockCall(onChange, 3)).toEqual([
      { id: 1, task: "buy egg", done: false, dueDate: expect.any(Date) },
      { id: 2, task: "hello", done: false, dueDate: expect.any(Date) },
      { id: 3, task: "", done: false, dueDate: expect.any(Date) },
    ]);
  });

  it("should handle complex remove + add combination with Raw 'defaultValue' component", async () => {
    const onChange = jest.fn();

    const { container } = render(
      <TodoApp
        onChange={onChange}
        defaultValue={[
          { id: 1, task: "buy egg", done: false, dueDate: new Date() },
        ]}
      />,
    );

    let input = getByTestId(container, "input:1");
    expect(input).toHaveValue("buy egg");

    const appendButton = getByTestId(container, "button:append");
    fireEvent.click(appendButton);

    expect(dataOfMockCall(onChange, 1)).toEqual([
      { id: 1, task: "buy egg", done: false, dueDate: expect.any(Date) },
      { id: 2, task: "", done: false, dueDate: expect.any(Date) },
    ]);

    input = getByTestId(container, "input:2");
    expect(input).toHaveValue("");

    fireEvent.change(input, { target: { value: "hello" } });

    expect(dataOfMockCall(onChange, 2)).toEqual([
      { id: 1, task: "buy egg", done: false, dueDate: expect.any(Date) },
      { id: 2, task: "hello", done: false, dueDate: expect.any(Date) },
    ]);

    fireEvent.click(appendButton);

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(dataOfMockCall(onChange, 3)).toEqual([
      { id: 1, task: "buy egg", done: false, dueDate: expect.any(Date) },
      { id: 2, task: "hello", done: false, dueDate: expect.any(Date) },
      { id: 3, task: "", done: false, dueDate: expect.any(Date) },
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
        {({ register }) => {
          return (
            <TodoApp
              {...register("todos", [
                { id: 1, task: "buy egg", done: false, dueDate: new Date() },
              ])}
            />
          );
        }}
      </SigForm>,
    );

    let input = getByTestId(container, "input:1");
    expect(input).toHaveValue("buy egg");

    input = getByTestId(container, "input:1");
    fireEvent.change(input, { target: { value: "invalid" } });
    expect(input).toHaveValue("invalid");

    expect(dataOfMockCall(onChange, 1)).toEqual({
      todos: [
        { id: 1, task: "invalid", done: false, dueDate: expect.any(Date) },
      ],
    });
    const error = getByTestId(container, "input:1:error");
    expect(error.innerText).toEqual("some error");

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
