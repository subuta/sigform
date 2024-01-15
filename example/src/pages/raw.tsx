import { TodoApp } from "@/components/TodoApp";
import cx from "classnames";
import React from "react";
import { SigForm } from "sigform";

export default function Index() {
  return (
    <TodoApp.Raw
      onChange={(todos) => {
        console.log("change!", JSON.stringify(todos, null, 2));
      }}
      defaultValue={[]}
    />
  );
}
