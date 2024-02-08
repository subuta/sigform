import { TodoApp } from "@/components/TodoApp";
import React from "react";

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
