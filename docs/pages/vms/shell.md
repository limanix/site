---
description: Open a shell in a VM, keep named sessions and run single commands from the Mac.
---

# Shell and sessions

`limanix shell` connects your terminal on the Mac to a VM:

- [a login shell](#open-a-shell) to work in;
- [one command](#run-one-command), for scripts too;
- [a named session](#use-a-named-session) that outlives your terminal.

## Open a shell

::: code-group

```sh [Mac]
limanix shell dev-box
```

:::

You log in as `user.name`, in its home `user.home`; both come from `[user]` in `limanix.toml`. The
login shell is Zsh with the `terminal` preset and Bash with `minimal`; see
[Shell](/config/shell). The welcome summary appears when you enter, and `lmx welcome` shows it
again.

Your home is the managed home shared with the Mac, and a shared project folder is at its target,
such as `/workspace`; see [Files and storage](/vms/storage). Type `exit` to return to the Mac: the
VM keeps running until you stop it.

::: info
The VM must be running. Start a stopped one with `limanix start dev-box`.
:::

## Run one command

Put the command after `--`:

::: code-group

```sh [Mac]
limanix shell dev-box -- id
```

:::

The command runs as the same user and starts in the home. `limanix shell` exits with the command's
status: in a script, `limanix shell dev-box -- true` succeeds when you can reach the VM as that
user.

The arguments reach the VM unchanged, without a shell. For `cd`, pipelines or variables, run a
shell in the VM, and keep the command in single quotes so that the Mac's shell does not expand
`$HOME` first:

::: code-group

```sh [Mac]
limanix shell dev-box -- bash -lc 'cd /workspace && pwd'
limanix shell dev-box -- bash -lc 'printf "%s\n" "$HOME"'
```

:::

## Use a named session

A named session keeps your terminal work running in the VM when the connection closes. It needs a
session provider in the VM, usually tmux: the `terminal` preset includes it, and `minimal` adds it
with `multiplexer = "tmux"`; see [Choose a provider](#choose-a-provider).

Open the session `work`, or return to it:

::: code-group

```sh [Mac]
limanix shell dev-box --session work
```

:::

- The first call creates the session; later calls attach to it.
- `--session` also works before the VM name: `limanix shell --session work dev-box`.
- It needs a nonempty name and cannot be combined with a command after `--`.
- Inside the VM, `limanix-session work` opens the same session.

::: tip
With tmux, use names such as `work` or `project-api`. The command rejects a name with `.` or `:`,
which tmux would change, and exits with status 64.
:::

### Choose a provider

A provider in the VM runs the sessions. The catalog's provider is tmux: the `terminal` preset
includes it, and `multiplexer` adds it to the `minimal` preset:

::: code-group

```toml [limanix.toml]
[shell]
preset = "minimal"
multiplexer = "tmux"
```

:::

Apply the change with `limanix update`. A module of your own can provide the sessions instead; see
[Your own modules](/modules/custom). Without a provider, `--session` prints the `limanix.toml`
setting that adds one and exits with status 127.

### Detach and return

In tmux, press Ctrl-B, then `d`, to detach. The session keeps running in the VM; run the same
`limanix shell dev-box --session work` to return to it. [The terminal](/inside/terminal) covers
windows, panes and the other tmux keys.

### Sessions and restarts

::: warning
A session outlives a closed terminal, not a VM restart: `limanix stop` and `limanix update` end the
processes running in it.
:::

Before an update, save the tmux layout with Ctrl-B, Ctrl-S and wait for the save to finish; tmux
restores the layout the next time it starts. Running processes and unsaved editor buffers are not
restored.
