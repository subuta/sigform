# sigform

Nestable react form UI for allowing developer to construct complex form UI without hassle.

```bash
# For npm
npm i react sigform

# For yarn
yarn add react sigform
```

## How to use

SEE: [example](example/src/pages/index.tsx) For how to use it in Next.js project.

```tsx
import { sigfield } from "sigform";
import React from "react";

export const TextInput = sigfield<{}, string>((props, ref) => {
  const { name, setValue, value } = props;

  return (
          <div className="p-4 bg-red-400" ref={ref}>
            <input
                    name={name}
                    type="text"
                    onChange={(e) => setValue(e.target.value)}
                    value={value}
            />
          </div>
  );
});


// And use it with form wrapper (SigForm).
<SigForm
    onChange={(value, helpers) => {
      console.log("changed!", JSON.stringify(value, null, 2));
    }}
    onSubmit={(data) => {
      console.log("submit!", JSON.stringify(data, null, 2));
        // Will output this data
        // { "email": "hoge@example.com" }
    }}
>
    <TextInput name="email" defaultValue="hoge@example.com" />

    <button type="submit" className="p-1 border rounded">submit</button>
</SigForm>
```

### License

`MIT`, see the [LICENSE](LICENSE) file.

----

With Thanks to awesome OSS developers for inspiration. [unform/unform](https://github.com/unform/unform) / [preactjs/signals](https://github.com/preactjs/signals) / [jamiebuilds/unstated-next](https://github.com/jamiebuilds/unstated-next/tree/master) / [immerjs/immer](https://github.com/immerjs/immer)