import { TodoApp } from "@/components/TodoApp";
import cx from "classnames";
import React from "react";
import { SigForm } from "sigform";

const buttonClass = "px-2 py-1 rounded border";

export default function Index() {
  return (
    <div>
      <SigForm
        onChange={(value, helpers) => {
          console.log("changed!", JSON.stringify(value, null, 2));

          // Check first input value.
          const specialCommand =
            value.todos && value.todos[0] && value.todos[0].task;

          // Form level validation example.
          if (specialCommand === "invalid") {
            helpers.setFormErrors({
              todos: ["some error"],
            });
            return;
          }

          if (specialCommand === "clear") {
            // Clear values.
            helpers.setFormValues({ todos: [] });
            return;
          }

          helpers.clearFormErrors();
        }}
        onSubmit={(value, helpers) => {
          console.log("save!", JSON.stringify(value, null, 2));
        }}
      >
        {/* For usage with form */}
        <TodoApp
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
