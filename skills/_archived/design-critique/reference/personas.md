# Persona-Based Design Testing

Test the interface through the eyes of distinct user archetypes. Each persona exposes different failure modes.

**How to use**: Select 2-3 personas most relevant. Walk through the primary user action as each persona. Report specific red flags — not generic concerns.

## Persona Selection Table

| Interface Type | Recommended Personas |
|---------------|---------------------|
| SaaS dashboard | Alex (Power User), Jordan (First-Timer), Sam (Accessibility) |
| E-commerce | Jordan (First-Timer), Morgan (Mobile-First), Sam (Accessibility) |
| Developer tool | Alex (Power User), Jordan (First-Timer) |
| Content site | Morgan (Mobile-First), Sam (Accessibility), Jordan (First-Timer) |
| Internal tool | Alex (Power User), Riley (Stressed/Distracted) |

---

## 1. Alex — Impatient Power User

**Profile**: Expert with similar products. Expects efficiency, hates hand-holding. Will find shortcuts or leave.

**Behaviors**: Skips all onboarding. Looks for keyboard shortcuts. Tries bulk-select and batch-edit. Gets frustrated by required steps that feel unnecessary.

**Test Questions**:
- Can Alex complete the core task in under 60 seconds?
- Are there keyboard shortcuts for common actions?
- Can onboarding be skipped entirely?
- Do modals have keyboard dismiss (Esc)?
- Is there a "power user" path (shortcuts, bulk actions)?

**Red Flags**: Forced tutorials, no keyboard navigation, slow unskippable animations, one-item-at-a-time workflows, redundant confirmation steps.

---

## 2. Jordan — Confused First-Timer

**Profile**: Never used this type of product. Needs guidance at every step. Will abandon rather than figure it out.

**Behaviors**: Reads all instructions carefully. Hesitates before clicking anything unfamiliar. Looks for help constantly. Takes the most literal interpretation of any label.

**Test Questions**:
- Is the first action obviously clear within 5 seconds?
- Are all icons labeled with text?
- Is there contextual help at decision points?
- Does terminology assume prior knowledge?
- Is there clear "back" or "undo" at every step?

**Red Flags**: Icon-only navigation, technical jargon, no visible help, ambiguous next steps, no success confirmation.

---

## 3. Sam — Accessibility-First User

**Profile**: Uses screen reader or keyboard-only navigation. May have visual impairments, motor limitations, or cognitive differences.

**Behaviors**: Relies on semantic HTML and ARIA. Navigates by headings and landmarks. Needs sufficient contrast and clear focus indicators.

**Test Questions**:
- Can every action be completed via keyboard?
- Are focus indicators visible and clear?
- Does heading hierarchy make sense read aloud?
- Do images have meaningful alt text?
- Are form errors announced to screen readers?

**Red Flags**: Missing focus indicators, non-semantic HTML (divs as buttons), missing alt text, contrast failures, keyboard traps.

---

## 4. Morgan — Mobile-First User

**Profile**: Primarily uses phone. Switches between portrait and landscape. Has intermittent connectivity. Fat fingers.

**Behaviors**: Scrolls quickly. Uses thumb for most interactions. Gets frustrated by tiny touch targets. Expects fast loading.

**Test Questions**:
- Are all touch targets 44x44px minimum?
- Does the layout work in portrait and landscape?
- Are critical actions reachable by thumb?
- Does the interface degrade gracefully offline?
- Is text readable without zooming?

**Red Flags**: Touch targets <44px, horizontal scroll, hidden functionality, slow loading without feedback, text <14px.

---

## 5. Riley — Stressed/Distracted User

**Profile**: Using the interface while multitasking, under time pressure, or in a stressful situation (e.g., customer support, incident response).

**Behaviors**: Scans rather than reads. Makes hasty decisions. May not notice subtle UI cues. Needs clear, unambiguous actions.

**Test Questions**:
- Is the critical action visually dominant?
- Can the task be completed without reading fine print?
- Are destructive actions clearly marked and protected?
- Is the interface usable in a noisy, distracting environment?

**Red Flags**: Competing CTAs, important info in fine print, easily-confused destructive buttons, excessive required fields.
