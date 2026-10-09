# Branch Creation Prompt

Use the text below as instructions for the agent responsible for creating a new branch:

```text
Create a new local branch based on the latest `dev` branch from the appropriate remote. The branch name must be provided by the user as input accompanying this prompt.

## Validate the input and inspect the repository

1. Use the exact branch name supplied by the user. If the user did not provide one, ask for it; do not invent or infer a name.
2. Validate the name with `git check-ref-format --branch <branch-name>`. If it is invalid, report the problem and ask the user for a valid name.
3. Inspect the current branch, configured remotes, and `git status`. Review staged, unstaged, and untracked changes so you know what must be preserved.
4. If a local branch or remote branch with the requested name already exists, do not reset, overwrite, or reuse it. Report the conflict and ask the user for a different name.

## Update the remote `dev` reference

1. Identify the repository's appropriate remote (use the current branch's upstream remote when clearly configured, otherwise use `origin` if it is the only appropriate remote). If the correct remote is ambiguous, ask the user which remote to use.
2. Fetch the latest `dev` from that remote and verify the resulting remote-tracking reference, such as `<remote>/dev`.
3. Do not check out, pull into, reset, or otherwise update the local `dev` branch or its working tree. Fetching the remote reference must not alter files in the worktree. Never base the new branch on a stale local `dev` when the fetched remote-tracking branch is available.
4. If the fetch fails or the remote `dev` branch cannot be verified, stop without creating the branch and report the issue.

## Create the branch safely

1. Create the new branch from the fetched remote-tracking `dev` reference, not from the current branch. For example, use `git switch -c <branch-name> <remote>/dev` when it is safe to switch.
2. Preserve every pre-existing change in the working tree, including staged, unstaged, and untracked files. Do not edit, stage, discard, stash, commit, or overwrite any such changes.
3. If the working tree is not clean, do not switch the checked-out branch, because doing so could carry or disturb existing work. Create only the branch reference from `<remote>/dev` (for example, `git branch <branch-name> <remote>/dev`) and leave the current branch and all files untouched. Tell the user the branch was created but not checked out.
4. If switching would overwrite or conflict with any existing file, do not force it. Leave the current branch and files untouched; if appropriate, keep only the newly created branch reference and tell the user it was not checked out.
5. Do not push the new branch.

## Verify and report

- Verify that the new branch points to the same commit as the fetched `<remote>/dev` reference.
- If it was safe to switch, verify that the new branch is checked out. Otherwise, verify that the original branch remains checked out and the worktree changes are preserved.
- Report the new branch name, its base remote and commit, whether it was checked out, and any preserved working-tree changes or blockers.
```
