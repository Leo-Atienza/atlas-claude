# Trusted Types (XSS Prevention)

**Chrome 83+ (enforced), others partial**

## Create a policy

```js
const policy = trustedTypes.createPolicy('default', {
  createHTML: (input) => DOMPurify.sanitize(input),
  createScriptURL: (input) => {
    const allowedOrigins = ['https://cdn.trusted.com', 'https://static.myapp.com'];
    const url = new URL(input, location.origin);
    if (allowedOrigins.includes(url.origin)) return input;
    throw new TypeError(`Blocked script URL: ${input}`);
  },
  createScript: () => { throw new TypeError('Inline scripts not allowed'); },
});

// Usage
element.innerHTML = policy.createHTML(userInput);   // Sanitized
script.src = policy.createScriptURL('/my-script.js'); // Allowlisted
```

## Enforcement via CSP

```
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types default
```

## Report-only mode (safe rollout)

```
Content-Security-Policy-Report-Only: require-trusted-types-for 'script'; report-uri /csp-report
```

## Feature detection

```js
if (window.trustedTypes && trustedTypes.createPolicy) {
  // Apply policy
}
```
