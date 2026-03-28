---
name: flow:auto
description: "Full autonomous pipeline: plan -> go -> review -> ship"
argument-hint: "[feature description]"
disable-model-invocation: true
---

Run these slash commands in order. Do not stop between steps — complete every step through to the end.

1. `/flow:plan $ARGUMENTS`
2. `/flow:go`
3. `/flow:review`
4. `/flow:ship --pr`

Start with step 1 now.
