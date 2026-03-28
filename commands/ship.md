# /ship — Commit, push, and open PR

Check context:
1. If inside a `.flow/` project → run `/flow:ship` (handles commit + push + PR + optional feature video)
2. Otherwise → run `/commit-commands:commit-push-pr`

Both handle the full sequence:
1. Stage relevant files
2. Write a conventional commit message based on changes
3. Push to remote
4. Open a pull request with description

No extra steps needed. Just execute it.

---

**Plain English triggers**: "ship it", "push this", "create a PR",
"submit PR", "push and PR", "ship", "release this"
