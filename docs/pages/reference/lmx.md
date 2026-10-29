---
description: Every command and option of lmx, the command inside each LimaNix VM, with the privileges it needs.
---

# lmx command

`lmx` is the command inside every LimaNix VM. It shows the state of the guest and what to do about a problem, and it carries out the updates that `limanix` starts on the Mac. The work that must outlive your terminal, such as a build or a Nix store cleanup, runs in `lmxd`, a root daemon under systemd. [The lmx command](/inside/lmx) shows how to use it day to day.

## Usage

::: code-group

```sh [VM]
lmx [COMMAND]
```

:::

`lmx` without a command, `lmx --help` and `lmx -h` print the guest help page: the VM, your account, the selected modules, and the commands inside the VM and on the Mac. `lmx COMMAND --help` prints the options of one command.

| Option            | Description                                                       |
| ----------------- | ----------------------------------------------------------------- |
| `-h`, `--help`    | Print the guest help page, or the help of the command it follows. |
| `-V`, `--version` | Print the version of `lmx`.                                       |

`--json`, on the commands that take it, answers with the JSON host contract instead of text: one line with `contract`, `ok`, and `data` or `error`. `limanix` on the Mac reads these answers.

Colors follow `[theme]` in `limanix.toml`. Output that does not go to a terminal, `NO_COLOR` and `TERM=dumb` turn them off.

### Privileges

| Command                                              | Needs                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `lmx store reserve`, `lmx apply`, `lmx apply cancel` | Root, with `sudo`, and a running `lmxd`.                                                                |
| `lmx status --wait`                                  | A running `lmxd`.                                                                                       |
| `lmx logs`                                           | Root, or membership in the `wheel` or `systemd-journal` group, which may read the journal of `lmxd`.    |
| `lmx dotfiles link`                                  | The development account. It refuses any other user, root included.                                      |
| `lmx status`, `lmx doctor`, `lmx net check`          | Nothing. With `sudo` they read more: the generation the Mac selected, and the processes of other users. |
| Every other command                                  | Nothing.                                                                                                |

### Exit status

| Status | Meaning                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------- |
| `0`    | Success.                                                                                          |
| `1`    | The command failed, or a check of `lmx doctor` or `lmx net check` failed.                         |
| `2`    | Usage error.                                                                                      |
| `3`    | `lmxd` is unavailable. Only `store reserve`, `apply`, `apply cancel` and `status --wait` need it. |
| `127`  | `lmx session` or `limanix-session` found no session provider.                                     |
| `130`  | The apply was cancelled.                                                                          |

## `lmx help`

Show the workspace and its commands, or what a module gives you.

::: code-group

```sh [VM]
lmx help [TOPIC]
```

:::

<!-- @include: ../../.reference/lmx.md#lmx-help -->

Without a topic, `lmx help` prints the guest help page, whose `lmx help TOPIC` line lists the topics. With a topic, it prints the module's help card: what the module installed in this VM, its commands, common tasks and a link to its guide. A topic without a card fails and lists the topics that have one. Your own modules can add a card with the NixOS option `limanix.help.<topic>`.

## `lmx info`

Show the kernel, guest disk, shared folders and failed units.

::: code-group

```sh [VM]
lmx info
```

:::

`lmx info` prints the VM and its architecture, your account, home and selected modules, then the kernel, the guest disk usage, the shared folders with their type and mode, and the failed systemd units. When a part cannot be read, it says so and exits with status `1` after printing the rest.

## `lmx welcome`

Show the workspace welcome again.

::: code-group

```sh [VM]
lmx welcome
```

:::

The welcome appears once per session when the development account opens an interactive shell in a terminal. It shows the state of the guest with what to do next, the VM, its system and resources, the guest disk, the addresses and open ports, the shared folders and the selected modules.

## `lmx status`

Show generations, disk usage, network interfaces and failed units.

::: code-group

```sh [VM]
lmx status [--json]
lmx status --short
lmx status --wait converged --generation GENERATION [--timeout DURATION] [--json]
```

:::

<!-- @include: ../../.reference/lmx.md#lmx-status -->

<!-- @include: ../../.reference/lmx.md#lmx-status-values -->

| Line           | Shows                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `Generation`   | The generation the Mac selected (`desired`), the one built for the next boot (`built`) and the one running now (`booted`). |
| `Disk`         | Free space on the disk that holds the Nix store. On a file system with an inode table, free inodes too.                    |
| `Network`      | The guest's interfaces and addresses.                                                                                      |
| `Failed units` | systemd units that failed.                                                                                                 |
| `Owner`        | The version of `lmxd` and what it is doing.                                                                                |
| `Condition`    | What needs attention and why, when something does.                                                                         |
| `Problem`      | Why a fact could not be read. That fact shows `unknown`; the other lines still show.                                       |

Without `sudo`, the generation the Mac selected may show as `unknown`: its mount is readable only by root.

`--short` prints one word per thing that needs attention, and nothing while all is well. It never waits more than 200 ms for `lmxd` and exits with status `0`.

| Word       | Meaning                                                  |
| ---------- | -------------------------------------------------------- |
| `degraded` | The running generation failed its health check.          |
| `finalize` | The update works, but removing older generations failed. |
| `disk-low` | Less than 10% of the store disk is free.                 |
| `restart`  | A new generation is built and waits for a restart.       |
| `applying` | An update is being built now.                            |
| `apply`    | The Mac selected a generation that is not built yet.     |
| `lmxd?`    | `lmxd` did not answer within 200 ms.                     |

`--wait` asks `lmxd` every two seconds until the generation is converged, then answers as `lmx status` does. A failed finalize of that generation ends the wait at once. At the timeout, the command fails. `limanix update` runs it after it restarts the VM.

## `lmx doctor`

Diagnose the configuration, `lmxd` and the generations, with what to do next.

::: code-group

```sh [VM]
lmx doctor [--json]
```

:::

<!-- @include: ../../.reference/lmx.md#lmx-doctor -->

Each line is one check: its status, its name and a message, with what to do on an indented line below.

<!-- @include: ../../.reference/lmx.md#lmx-doctor-checks -->

| Status    | Meaning                                                               |
| --------- | --------------------------------------------------------------------- |
| `ok`      | Fine.                                                                 |
| `warning` | Worth knowing; nothing is broken.                                     |
| `failed`  | Broken. The command exits with status `1`.                            |
| `unknown` | Your account cannot read what the check needs. Run `sudo lmx doctor`. |

`lmx doctor` works without `lmxd`. On the Mac, [`limanix doctor NAME`](/reference/cli#limanix-doctor) runs the same checks and adds the VM and its address.

## `lmx net check`

Check why a port of this VM may be unreachable from the Mac: firewall, listener and process.

::: code-group

```sh [VM]
lmx net check PORT [--udp] [--json]
```

:::

<!-- @include: ../../.reference/lmx.md#lmx-net-check -->

<!-- @include: ../../.reference/lmx.md#lmx-net-check-checks -->

The command exits with status `1` when a check failed. Run it with `sudo` to see the processes of other users. On the Mac, [`limanix network check NAME PORT`](/reference/cli#limanix-network-check) runs the same checks, then connects from the Mac.

## `lmx logs`

Show the output of the latest `lmxd` task of a kind, from the journal.

::: code-group

```sh [VM]
sudo lmx logs KIND [--previous]
```

:::

<!-- @include: ../../.reference/lmx.md#lmx-logs -->

<!-- @include: ../../.reference/lmx.md#lmx-logs-values -->

`lmx logs` prints the task, its generation and its start time in UTC, then its lines.
It fails when no task of that kind ran in the selected boot.
Use `sudo lmx logs apply` when a build failed and the VM has not restarted since.
Use `sudo lmx logs apply --previous` when the build ran in the boot immediately before the current one, such as after the update restarted the VM.

## `lmx version`

Show the `lmx` version and the host contract it speaks.

::: code-group

```sh [VM]
lmx version [--json]
```

:::

<!-- @include: ../../.reference/lmx.md#lmx-version -->

It prints `lmx VERSION (host contract N)`.

## `lmx store reserve`

Collect unreferenced Nix store paths when free space is low. The work runs in `lmxd`.

::: code-group

```sh [VM]
sudo lmx store reserve [--json]
```

:::

<!-- @include: ../../.reference/lmx.md#lmx-store-reserve -->

When less than 20% of the store disk is free, `lmxd` collects the store paths that nothing uses, and the command waits for the collection. It then prints how much it freed, or `Nothing was collected.`, and the free space of the guest disk. A collection that already runs is shared, and interrupting the command does not stop it. The command fails when less than 10% is still free afterwards. `limanix update` runs it before the build.

## `lmx apply`

Build a generation that the Mac prepared for the next boot. The work runs in `lmxd`.

::: code-group

```sh [VM]
sudo lmx apply --generation GENERATION [--follow] [--json]
```

:::

<!-- @include: ../../.reference/lmx.md#lmx-apply -->

`limanix update` runs it for you. `lmxd` makes room in the store as `lmx store reserve` does, builds the generation with `nixos-rebuild boot`, then installs its environment files into `/etc/limanix`. A failed or cancelled build leaves the installed files as they were. Interrupting the command does not stop the apply, and running it again attaches to the running apply. An apply of another generation is cancelled and replaced. After a successful apply, the generation waits for a restart. A cancelled apply exits with status `130`.

## `lmx apply cancel`

Cancel the apply of a generation and wait until it stops.

::: code-group

```sh [VM]
sudo lmx apply cancel --generation GENERATION [--json]
```

:::

<!-- @include: ../../.reference/lmx.md#lmx-apply-cancel -->

`limanix update` runs it when you press Ctrl-C. The build is killed; a boot loader update that `nixos-rebuild` already started finishes in its own unit. A build that had already finished installs its environment files and reports success.

## `lmx clipboard copy`

Copy standard input to the Mac clipboard. Also installed as `pbcopy`.

::: code-group

```sh [VM]
lmx clipboard copy < FILE
```

:::

The input travels through your terminal as an OSC 52 sequence, or through tmux inside a tmux session. The terminal on the Mac must allow it.

Guide: [Clipboard](/inside/clipboard).

## `lmx clipboard paste`

Print the Mac clipboard, if the terminal allows reads. Also installed as `pbpaste`.

::: code-group

```sh [VM]
lmx clipboard paste
```

:::

`paste` asks the terminal for the clipboard and waits up to 10 seconds for the answer. Reading the clipboard usually needs one more permission in the terminal than writing it. When the terminal does not share the clipboard, the command says so on standard error and exits with status `1`.

Guide: [Clipboard](/inside/clipboard).

## `lmx session`

Open a named session with the selected provider. Also installed as `limanix-session`.

::: code-group

```sh [VM]
lmx session NAME
```

:::

<!-- @include: ../../.reference/lmx.md#lmx-session -->

The command creates the session or attaches to it with the provider the VM's configuration selects, such as tmux; the provider then owns the terminal and the exit status. Without a provider, it says which setting of `limanix.toml` adds one and exits with status `127`. [`limanix shell NAME --session SESSION`](/reference/cli#limanix-shell) on the Mac runs `limanix-session SESSION`.

Guide: [Shell and sessions](/vms/shell).

## `lmx dotfiles`

Show which of your dotfiles from the Mac are linked into your home, without changing anything.

::: code-group

```sh [VM]
lmx dotfiles [status]
```

:::

`lmx dotfiles` and `lmx dotfiles status` print the dotfiles directory and the home, then one line per entry: `linked`, `missing`, or `conflict` for a path of your own that is in the way. Without dotfiles in `limanix.toml`, it says that none are configured.

Guide: [Dotfiles](/config/dotfiles).

## `lmx dotfiles link`

Link the dotfiles into your home.
Each interactive Bash or Zsh shell of the development account does it as it starts.

::: code-group

```sh [VM]
lmx dotfiles link [--quiet]
```

:::

<!-- @include: ../../.reference/lmx.md#lmx-dotfiles-link -->

- It links each top-level entry of the dotfiles that starts with `.` into the home, and each entry of their `.config` into `~/.config`, and prints each change. `.git`, `.github`, `.gitignore`, `.gitmodules` and `.DS_Store` are never linked.
- It changes only links that point into the dotfiles. A file, a directory or a link to anywhere else stays and is a conflict; a conflict does not fail the command.
- When an entry is gone from the dotfiles, its link is removed. A link you made to another path in the dotfiles stays.
- While the dotfiles directory is not mounted, it links and removes nothing.
- It runs only as the development account: with `sudo`, the links in the home would belong to root.

Guide: [Dotfiles](/config/dotfiles).

## Other names

The `lmx` binary is also installed under these names. Each keeps the arguments, messages and exit statuses of the command it replaces.

| Name                   | Runs                  | Arguments                                                     |
| ---------------------- | --------------------- | ------------------------------------------------------------- |
| `pbcopy`               | `lmx clipboard copy`  | None; input comes from standard input, as in `pbcopy < FILE`. |
| `pbpaste`              | `lmx clipboard paste` | None.                                                         |
| `limanix-session NAME` | `lmx session NAME`    | Exactly one nonempty name.                                    |
