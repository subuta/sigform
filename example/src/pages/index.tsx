import { TodoApp } from "@/components/TodoApp";
import cx from "classnames";
import React, { useEffect, useRef } from "react";
import { SigForm } from "sigform";

const buttonClass = "px-2 py-1 rounded border";

export default function Index() {
  const ref = useRef<HTMLDivElement>();

  useEffect(() => {
    // sigfield allows to use "forwardRef" also.
    // console.log("ref", ref.current);
  }, []);

  return (
    <div>
      <SigForm
        onChange={(data, helpers) => {
          console.log("changed!", JSON.stringify(data, null, 2));

          // Check first input data.
          const specialCommand =
            data.todos && data.todos[0] && data.todos[0].task;

          // Form level validation example.
          if (specialCommand === "invalid") {
            helpers.setFormErrors({
              todos: ["some error"],
            });
            return;
          }

          if (specialCommand === "clear") {
            // Clear values.
            requestAnimationFrame(() => {
              helpers.setFieldValues({ todos: [] });
            });
            return;
          }

          helpers.clearFormErrors();
        }}
        onSubmit={(data, helpers) => {
          console.log("save!", JSON.stringify(data, null, 2));
        }}
      >
        {/* For usage with form */}
        <TodoApp
          ref={ref}
          name="todos"
          defaultValue={[
            { id: 1, task: "buy egg", done: false, dueDate: new Date() },
          ]}
        />

        {/*
        // Or use "Raw" component.
        <TodoApp.Raw
          onChange={(todos) => {
            console.log(JSON.stringify(todos, null, 2));
          }}
          value={initialTodos}
        />
        */}

        <button
          className={cx(
            buttonClass,
            "mt-4 px-3 py-2 bg-blue-500 text-white font-bold",
          )}
          type="submit"
        >
          Save
        </button>
      </SigForm>
    </div>
  );
}
