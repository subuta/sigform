import {
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * A function that simulates the React.useState hook with a callback parameter.
 * SEE: [TypeScript function to simulate React.useState with callback](https://gist.github.com/vagnerlandio/e42b8fbab0a61e60878b614e4e3e430f)
 *
 * @template T The type of the state value.
 *
 * @param {T} initialValue The initial value for the state.
 * @param {(value: T) => void} callback The callback function to be called after the state has been updated.
 *
 * @returns {[T, (newValue: T, callback?: () => void) => void]} A tuple containing the current state value and a function to update the state.
 */
export function useStateWithCallback<T>(
  initialValue: T,
): [T, (newValue: SetStateAction<T>, callback?: () => void) => void] {
  const [state, setState] = useState<T>(initialValue);
  const callbackRef = useRef<() => void | undefined>();

  const setStateWithCallback = useCallback(
    (newValue: SetStateAction<T>, callback?: () => void) => {
      setState(newValue);
      callbackRef.current = callback;
    },
    [],
  );

  useEffect(() => {
    callbackRef.current && callbackRef.current();
  }, [state]);

  return [state, setStateWithCallback];
}
