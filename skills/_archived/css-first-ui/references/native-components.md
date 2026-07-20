# Native Component System — Popover + Anchor + Dialog

## Complete Dropdown Menu

```html
<div class="dropdown">
  <button popovertarget="dropdown-menu" style="anchor-name: --dropdown">
    Actions <span aria-hidden="true">&#9662;</span>
  </button>
  <menu id="dropdown-menu" popover style="
    position-anchor: --dropdown;
    position-area: bottom span-left;
    position-try-fallbacks: top span-left, bottom span-right;
    margin-block-start: 4px;
  ">
    <li><button onclick="edit()">Edit</button></li>
    <li><button onclick="duplicate()">Duplicate</button></li>
    <li role="separator"></li>
    <li><button onclick="remove()">Delete</button></li>
  </menu>
</div>
```

```css
/* Dropdown animation */
[popover] {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.25rem;
  box-shadow: 0 4px 16px oklch(0 0 0 / 0.1);
  min-width: 180px;
  list-style: none;

  transition: opacity 0.15s, transform 0.15s, display 0.15s allow-discrete;
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

[popover]:popover-open {
  opacity: 1;
  transform: translateY(0) scale(1);
}

@starting-style {
  [popover]:popover-open {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
}

/* Menu items */
[popover] button {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  text-align: left;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

[popover] button:hover {
  background: var(--color-accent-subtle);
}

[popover] [role="separator"] {
  height: 1px;
  background: var(--color-border);
  margin: 0.25rem 0;
}
```

## Complete Tooltip

```html
<span style="anchor-name: --info-anchor">
  <button popovertarget="info-tip" class="info-trigger">?</button>
</span>
<div id="info-tip" popover="hint" class="tooltip" style="
  position-anchor: --info-anchor;
  position-area: top center;
  position-try-fallbacks: bottom center, right center, left center;
  margin-block-end: 8px;
">
  This is helpful context about the feature.
</div>
```

```css
.tooltip {
  background: var(--color-text);
  color: var(--color-surface);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  max-width: 280px;
  line-height: 1.4;

  transition: opacity 0.1s, display 0.1s allow-discrete;
  opacity: 0;
}
.tooltip:popover-open { opacity: 1; }
@starting-style { .tooltip:popover-open { opacity: 0; } }
```

## Toast Notification Stack

```html
<!-- Use popover="manual" — does not auto-dismiss other popovers -->
<div id="toast-1" popover="manual" class="toast">
  File saved successfully
  <button popovertarget="toast-1" popovertargetaction="hide">Dismiss</button>
</div>
```

```css
.toast {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  /* No anchor needed — fixed positioning */
}
```

```js
// Show toast programmatically
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast-1');
  toast.textContent = message;
  toast.showPopover();
  setTimeout(() => toast.hidePopover(), duration);
}
```

## Nested Popovers

```html
<button popovertarget="menu" style="anchor-name: --menu">File</button>
<div id="menu" popover style="position-anchor: --menu; position-area: bottom start;">
  <button popovertarget="submenu" style="anchor-name: --sub">Export &#9656;</button>
  <div id="submenu" popover style="position-anchor: --sub; position-area: right start;">
    <button>PDF</button>
    <button>CSV</button>
    <button>JSON</button>
  </div>
</div>
```

Nested `auto` popovers stack correctly — dismissing the parent also dismisses children.

## Modal Dialog with Return Value

```html
<dialog id="confirm-dialog">
  <form method="dialog">
    <h2>Delete this item?</h2>
    <p>This action cannot be undone.</p>
    <div class="dialog-actions">
      <button value="cancel">Cancel</button>
      <button value="confirm" autofocus>Delete</button>
    </div>
  </form>
</dialog>
```

```js
async function confirmDelete() {
  const dialog = document.getElementById('confirm-dialog');
  dialog.showModal();

  return new Promise((resolve) => {
    dialog.addEventListener('close', () => {
      resolve(dialog.returnValue === 'confirm');
    }, { once: true });
  });
}

// Usage
if (await confirmDelete()) {
  deleteItem(id);
}
```

## Feature Detection Pattern

```css
/* Anchor Positioning supported */
@supports (anchor-name: --test) {
  .tooltip {
    position-anchor: --trigger;
    position-area: top center;
    position-try-fallbacks: bottom center;
  }
}

/* Fallback: manual positioning */
@supports not (anchor-name: --test) {
  .tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
  }
}
```

```js
// JS fallback for Anchor Positioning
if (!CSS.supports('anchor-name', '--test')) {
  // Load Floating UI as fallback
  import('@floating-ui/dom').then(({ computePosition }) => {
    // Apply positioning
  });
}
```
