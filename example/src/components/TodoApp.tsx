import { DateInput } from "./DateInput";
import { TextInput } from "./TextInput";
import cx from "classnames";
import _ from "lodash";
import React, { useEffect } from "react";
import { sigfield } from "sigform";

const buttonClass = "px-2 py-1 rounded border";

type Todo = {
  id: number;
  task: string;
  done: boolean;
  dueDate: Date;
};

// Input field for TODO type.
const TodoInput = sigfield<
  { className?: string; onRemove: (todo: Todo) => void },
  Todo
>((props, ref) => {
  const { className = "", onRemove, value, mutate, error } = props;

  const todo = value;

  return (
    <div className={cx(className, "flex items-start")} ref={ref}>
      <TextInput.Raw
        onChange={(task) => {
          mutate((draft) => {
            draft.task = task;
          });
        }}
        error={error}
        value={todo.task}
        testId={`input:${todo.id}`}
      />

      <DateInput.Raw
        className="ml-2"
        onChange={(dueDate) => {
          mutate((draft) => {
            draft.dueDate = dueDate;
          });
        }}
        value={todo.dueDate}
      />

      <div className="ml-2 h-[34px] flex items-center">
        <button
          type="button"
          data-testid={`button:${todo.id}:toggle`}
          className={cx(
            "flex items-center text-xl",
            todo.done ? "text-green-400" : "text-gray-400",
          )}
          onClick={() => {
            mutate((draft) => {
              draft.done = !draft.done;
            });
          }}
        >
          <i className="material-symbols-outlined">check</i>
        </button>

        <button
          type="button"
          data-testid={`button:${todo.id}:remove`}
          className="ml-1 flex items-center text-xl text-gray-400 "
          onClick={() => onRemove(todo)}
        >
          <i className="material-symbols-outlined">close</i>
        </button>
        <span className="ml-2 text-xs text-gray-400 font-bold">
          ID: {todo.id}
        </span>
      </div>
    </div>
  );
});

// Input field for TODO array type.
export const TodoApp = sigfield<{}, Todo[], string[]>((props, ref) => {
  let { value, defaultValue, helpers, mutate, error } = props;

  const todos = value ?? defaultValue;
  const isEmpty = todos.length === 0;

  // Field level validation example.
  useEffect(() => {
    if (todos[0] && todos[0].task === "hoge") {
      helpers.setFieldError(["fuga"]);
    }
  }, [todos]);

  return (
    <div className="p-4 bg-gray-100 rounded-lg" ref={ref}>
      {isEmpty ? (
        <p>No task</p>
      ) : (
        todos.map((todo, i) => {
          const isLast = i === todos.length - 1;

          return (
            <TodoInput.Raw
              error={props.error && props.error[i]}
              className={isLast ? "" : "mb-4"}
              key={todo.id}
              onChange={(todo) => {
                mutate((draft) => {
                  draft[i] = todo;
                });
              }}
              value={todo}
              onRemove={({ id }) => {
                mutate((draft) => {
                  return draft.filter((t) => t.id !== todo.id);
                });
              }}
            />
          );
        })
      )}

      <button
        type="button"
        data-testid="button:append"
        className={cx(buttonClass, "mt-4 bg-white")}
        onClick={() => {
          const nextId = (_.max(_.map(todos, "id")) || 0) + 1;
          mutate((draft) => {
            draft.push({
              id: nextId,
              task: "",
              done: false,
              dueDate: new Date(),
            });
          });
        }}
      >
        Add TODO
      </button>
    </div>
  );
});
