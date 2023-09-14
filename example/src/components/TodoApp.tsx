import { v4 as uuid } from "@lukeed/uuid";
import { untracked, useSignalEffect } from "@preact/signals-react";
import cx from "classnames";
import React, { useEffect } from "react";
import { sigfield } from "sigform";

const buttonClass = "px-2 py-1 rounded border";

// Input field for string type.
const TextInput = sigfield<{ className?: string }, string>((props) => {
  const { className, dataRef, field, error } = props;

  return (
    <div className={cx("relative", error && "pb-6")}>
      <input
        className={cx(
          className,
          "px-2 py-1 border rounded",
          error && "border-red-500",
        )}
        type="text"
        ref={dataRef}
        onChange={(e) => {
          field.value = e.target.value;
        }}
        value={field.value}
      />

      {error && (
        <p className="position absolute bottom-0 left-0 text-red-500 text-sm font-bold">
          {error}
        </p>
      )}
    </div>
  );
});

type Todo = {
  id: string;
  task: string;
};

// Input field for TODO type.
const TodoInput = sigfield<
  { className?: string; onRemove: (todo: Todo) => void },
  Todo
>((props) => {
  const { className = "", onRemove, dataRef, field } = props;

  return (
    <div className={cx(className, "flex items-start")} ref={dataRef}>
      <TextInput name="task" defaultValue={field.value.task} />

      <div className="ml-2 h-[34px] flex items-center">
        <button
          type="button"
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
export const TodoApp = sigfield<{}, Todo[]>((props) => {
  const { dataRef, field, helpers } = props;

  const todos = field.value;
  const isEmpty = todos.length === 0;

  // Field level validation example.
  useEffect(() => {
    const todos = field.value;
    if (todos[0] && todos[0].task === "hoge") {
      untracked(() => helpers.setFieldError([{ task: "fuga" }]));
    }
  }, [field.value]);

  return (
    <div className="p-4 bg-gray-100 rounded-lg" ref={dataRef}>
      {isEmpty ? (
        <p>No task</p>
      ) : (
        todos.map((todo, i) => {
          const isLast = i === todos.length - 1;

          return (
            <TodoInput
              className={isLast ? "" : "mb-4"}
              key={todo.id}
              name={i}
              defaultValue={todo}
              onRemove={({ id }) => {
                todos.splice(i, 1);
              }}
            />
          );
        })
      )}

      <button
        type="button"
        className={cx(buttonClass, "mt-4 bg-white")}
        onClick={() => {
          todos.push({ id: uuid(), task: "" });
        }}
      >
        Add TODO
      </button>
    </div>
  );
});
