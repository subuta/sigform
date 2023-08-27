# sigform

Nestable react form UI, which supports [Signals](https://github.com/preactjs/signals) as state management 
for allowing developer to construct complex form UI without hassle.

We follows simplified [unform](https://github.com/unform/unform) APIs.

## Installation

This library is distributed as "ESM package" and uses TypeScript. 
SEE: [Pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)

```bash
# For npm
npm i sigform @preact/signals-react react

# For yarn
yarn add sigform @preact/signals-react react
```

## How to use

SEE: [example](example/src/pages/index.tsx) For how to use it in Next.js project.

```tsx
// Define custom input
import { SForm, useSField } from "sigform";
import { useSignal, useSignalEffect, useComputed } from "@preact/signals-react";

export const EmailInput = (props: { name: string }) => {
    const email = useSignal("");
    
    // Register field to parent SForm as passed name (eg: 'email').
    useSField(name, email);

    // Watch "email" changes if needed.
    // For manipulating data, you can also use "useComputed"
    useSignalEffect(() => {
      console.log('email = ', email.value);
    });

    return (
        <input
            type="email"
            onChange={(e) => {
                // Data assigned to "signal" will be used as data on `submit`. 
                email.value = e.target.value;
            }}
            value={email.value}
        />
    )
}

// And use it with form wrapper (SForm).
<SForm
    onSubmit={(data, {reset}) => {
        console.log("got", data);
        // Will output this data
        // { "email": "hoge@example.com" }
        reset();
    }}
    initialData={{
        email: "hoge@example.com",
    }}
>
    <EmailInput name="email"/>

    <SForm.Submit className="p-1 border rounded">submit</SForm.Submit>
</SForm>
```

### Notes

- We use fixed version of Next.js "v13.2.4" for example because of this issue.
    - SEE: [[NEXT-1103] Cannot read properties of null (reading 'useState') with Context Wrapper · Issue #48518 · vercel/next.js](https://github.com/vercel/next.js/issues/48518)

### License

`MIT`, see the [LICENSE](LICENSE) file.

### TODOs

- [ ] Add tests.
- [ ] Add more examples.
- [ ] Add JS transpilation setup for distribution.

----

With Thanks to awesome OSS developers for inspiration. [unform/unform](https://github.com/unform/unform) / [preactjs/signals](https://github.com/preactjs/signals) / [jamiebuilds/unstated-next](https://github.com/jamiebuilds/unstated-next/tree/master)