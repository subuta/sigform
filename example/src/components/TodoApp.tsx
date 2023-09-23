import { untracked } from "@preact/signals-react";
import cx from "classnames";
import _ from "lodash";
import React, { useEffect } from "react";
import { mutate, sigfield } from "sigform";

const buttonClass = "px-2 py-1 rounded border";

// Input field for string type.
export const TextInput = sigfield<
  { className?: string; testId?: string },
  string
>((props, ref) => {
  const { className, field, error } = props;

  return (
    <div className={cx("relative", error && "pb-6")}>
      <input
        className={cx(
          className,
          "px-2 py-1 border rounded",
          error && "border-red-500",
        )}
        type="text"
        data-testid={props.testId || ""}
        ref={ref}
        onChange={(e) => {
          field.value = e.target.value;
        }}
        value={field.value}
      />

      {error && (
        <p
          className="position absolute bottom-0 left-0 text-red-500 text-sm font-bold"
          data-testid={props.testId ? `${props.testId}:error` : ""}
        >
          {error}
        </p>
      )}
    </div>
  );
});

type Todo = {
  id: number;
  task: string;
};

// Input field for TODO type.
const TodoInput = sigfield<
  { className?: string; onRemove: (todo: Todo) => void },
  Todo
>((props, ref) => {
  const { className = "", onRemove, field, error } = props;

  const todo = field.value;

  return (
    <div className={cx(className, "flex items-start")} ref={ref}>
      <TextInput.Raw
        onChange={(task) => {
          mutate(todo, (draft) => {
            draft.task = task;
          });
        }}
        error={error}
        value={todo.task}
        testId={`input:${field.value.id}`}
      />

      <div className="ml-2 h-[34px] flex items-center">
        <button
          type="button"
          data-testid={`button:${field.value.id}:remove`}
          className="flex items-center text-xl text-gray-400 "
          onClick={() => onRemove(field.value)}
        >
          <i className="material-symbols-outlined">close</i>
        </button>
        <span className="ml-2 text-xs text-gray-400 font-bold">
          ID: {field.value.id}
        </span>
      </div>
    </div>
  );
});

// Input field for TODO array type.
export const TodoApp = sigfield<{}, Todo[], string[]>((props, ref) => {
  let { field, helpers, error } = props;

  const todos = field.value;
  const isEmpty = todos.length === 0;

  // Field level validation example.
  useEffect(() => {
    const todos = field.value;
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
              value={todo}
              onRemove={({ id }) => {
                mutate(todos, (draft) => {
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
          mutate(todos, (draft) => {
            draft.push({ id: nextId, task: "" });
          });
        }}
      >
        Add TODO
      </button>
    </div>
  );
});
