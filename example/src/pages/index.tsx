import { TodoApp } from "@/components/TodoApp";
import cx from "classnames";
import React, { useEffect, useId, useMemo, useRef } from "react";
import { SigForm } from "sigform";

const buttonClass = "px-2 py-1 rounded border";

export default function Index() {
  // For preventing hydration(SSR) issue.
  const initialTaskId = useId();
  const initialTodos = useMemo(() => {
    return [{ id: initialTaskId, task: "buy egg" }];
  }, []);

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
              todos: [{ task: "some error" }],
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
        <TodoApp name="todos" defaultValue={initialTodos} />

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
