---
description: Every command, argument and flag of the limanix command on the Mac, with defaults and exit statuses.
---

# limanix command

<!-- @include: ../../.reference/cli.md#limanix-about -->

`limanix` runs on your Mac. It creates, changes, starts and opens the VMs that your `limanix.toml` files describe. Run it as your regular Mac user, without `sudo`. [Using virtual machines](/vms/) shows the everyday workflow.

## Usage

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-usage -->

:::

`limanix` without a command prints its help. `create` and `update` take the VM name from the `name` setting of the file you pass with `--config`; the other VM commands take the name as an argument.

<!-- @include: ../../.reference/cli.md#limanix -->

Only `limanix` itself takes `-v`.

Results go to standard output. Errors, as `limanix: MESSAGE`, and the build output of `create` and `update` go to standard error. For scripts, `list` and `modules list` take `-q` to print only names, and every command with a result takes `--json`; see [Use LimaNix in scripts](/vms/#use-limanix-in-scripts).

### Exit status

<!-- @include: ../../.reference/cli.md#limanix-exit-statuses -->

### Environment variables

<!-- @include: ../../.reference/cli.md#limanix-environment -->

Neither variable moves existing VMs or homes. Use the same values for every command that works on an existing VM. [Paths and ports](/reference/paths) lists what each folder holds.

## `limanix create`

<!-- @include: ../../.reference/cli.md#limanix-create-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-create-usage -->

:::

<!-- @include: ../../.reference/cli.md#limanix-create -->

`create` reads the VM name from the file, allocates the VM and its managed home, builds the NixOS system, restarts the VM into it and checks the development account. It downloads the base image when needed; the first run needs network access for the image and the Nix dependencies. It prints the build output to standard error, then:

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-create-output -->

:::

With `--json`, it prints the VM as an object with the fields of [`limanix list --json`](#limanix-list).

A name that already has saved state is rejected with `VM 'NAME' already has state; use update or delete`. When `create` fails after the VM exists, `limanix list` shows it with the state `error`: fix the problem and run `limanix update` with the same file.

Guide: [Using virtual machines](/vms/).

## `limanix update`

<!-- @include: ../../.reference/cli.md#limanix-update-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-update-usage -->

:::

<!-- @include: ../../.reference/cli.md#limanix-update -->

`update` selects the VM by the `name` in the file, keeps its disk and managed home, builds the new system in the VM and restarts it. The VM is running afterwards, even if it was stopped before. It prints the build output to standard error, then:

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-update-output -->

:::

With `--json`, it prints the VM as an object with the fields of [`limanix list --json`](#limanix-list).

- A running VM keeps running during the build and restarts once, after it. A stopped VM, or one whose disk or memory grows, gets the new Lima settings before the build.
- A failed build does not restart the VM, which keeps its current system and environment files. Steps before the failure are not undone: Lima settings applied before the build stay. A failure after the build can leave the VM stopped.
- Ctrl-C during the build cancels it in the VM, starts the guest's own `lmxd` again and exits with status `130`. A build that had already finished stays, and the VM boots it at its next restart.
- `resources.arch`, `user.name`, `user.home` and `home.root` are fixed when the VM is created. `resources.disk` can grow but not shrink.

Guide: [Changing a VM](/vms/update).

## `limanix start`

<!-- @include: ../../.reference/cli.md#limanix-start-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-start-usage -->

:::

<!-- @include: ../../.reference/cli.md#limanix-start-arguments -->

<!-- @include: ../../.reference/cli.md#limanix-start -->

`start` boots the saved VM and prints:

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-start-output -->

:::

With `--json`, it prints the VM as an object with the fields of [`limanix list --json`](#limanix-list). `start` does not read `limanix.toml`, rebuild the system or reset an earlier operation error: `limanix update` does that.

Guide: [Using virtual machines](/vms/).

## `limanix stop`

<!-- @include: ../../.reference/cli.md#limanix-stop-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-stop-usage -->

:::

<!-- @include: ../../.reference/cli.md#limanix-stop-arguments -->

<!-- @include: ../../.reference/cli.md#limanix-stop -->

`stop` shuts the VM down, and the running processes in the VM end. It prints:

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-stop-output -->

:::

With `--json`, it prints the VM as an object with the fields of [`limanix list --json`](#limanix-list).

Guide: [Using virtual machines](/vms/).

## `limanix shell`

<!-- @include: ../../.reference/cli.md#limanix-shell-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-shell-usage -->

:::

<!-- @include: ../../.reference/cli.md#limanix-shell-arguments -->

<!-- @include: ../../.reference/cli.md#limanix-shell -->

- Without a command, `shell` opens the login shell of the development user in their home: Zsh with the `terminal` preset, Bash with `minimal`. `exit` returns to the Mac; the VM keeps running.
- With `-- COMMAND`, the command starts in the user's home, and `limanix shell` exits with its status. For `cd`, pipes or variables, run a guest shell such as `bash -lc '...'`. Single quotes keep the Mac's shell from expanding them first.
- `--session SESSION`, or `--session=SESSION`, goes before or after the VM name, at most once, with a nonempty name. It runs `limanix-session SESSION` in the VM, which creates the session or attaches to it with the provider: `multiplexer = "tmux"` in [`[shell]`](/config/shell) or a module. Without a provider, the VM names the setting to add and the command exits with status `127`. The tmux provider rejects names containing `.` or `:`.
- A stopped VM fails with `VM 'NAME' is not running; use limanix start NAME`.

::: code-group

```sh [Mac]
limanix shell dev-box
limanix shell dev-box --session work
limanix shell dev-box -- id
limanix shell dev-box -- bash -lc 'cd /workspace && pwd'
```

:::

Guide: [Shell and sessions](/vms/shell).

## `limanix list`

<!-- @include: ../../.reference/cli.md#limanix-list-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-list-usage -->

:::

<!-- @include: ../../.reference/cli.md#limanix-list -->

<!-- @include: ../../.reference/cli.md#limanix-list-columns -->

Under a row, `list` prints the saved error of the last operation and a notice that says what to do, such as `the guest has no lmx yet; run limanix update`. `ADDRESS` and `DISK` come from `lmx status`, which `list` runs in each running VM with a 10-second limit. Without VMs, it prints `No VMs managed by Limanix.`

`-q` prints only the names, one per line, and nothing without VMs, for loops such as `for vm in $(limanix list -q)`. It cannot be combined with `--json`.

`--json` prints an array with one object per VM:

<!-- @include: ../../.reference/cli.md#limanix-list-json -->

Guide: [Using virtual machines](/vms/).

## `limanix doctor`

<!-- @include: ../../.reference/cli.md#limanix-doctor-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-doctor-usage -->

:::

<!-- @include: ../../.reference/cli.md#limanix-doctor-arguments -->

<!-- @include: ../../.reference/cli.md#limanix-doctor -->

`doctor` prints one row per check: its status, its name and a message, with the hint on a line below.

<!-- @include: ../../.reference/cli.md#limanix-doctor-checks -->

A VM that is stopped, or that another `limanix` command is changing, shows only `vm`. `doctor` does not repair or restart anything, and a warning does not fail it. `--json` prints an object with these fields:

<!-- @include: ../../.reference/cli.md#limanix-doctor-json -->

Guide: [Using virtual machines](/vms/). Problems by symptom: [Troubleshooting](/troubleshooting).

## `limanix delete`

<!-- @include: ../../.reference/cli.md#limanix-delete-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-delete-usage -->

:::

<!-- @include: ../../.reference/cli.md#limanix-delete-arguments -->

<!-- @include: ../../.reference/cli.md#limanix-delete -->

`delete` stops a running VM, then removes its guest disk, its Lima instance and its saved record. It also removes the record of a VM whose Lima instance is already missing. It prints these lines, the second one only without `--remove-home`:

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-delete-output -->

:::

With `--json`, it prints an object with these fields:

<!-- @include: ../../.reference/cli.md#limanix-delete-json -->

- There is no confirmation prompt.
- Your `limanix.toml` and the folders shared with `[[mounts]]` stay on the Mac.
- `--force` does not imply `--remove-home`.
- A preserved home is not attached to a new VM of the same name. After the VM is deleted, `delete --remove-home` can no longer remove it; keep the printed path to clean it up by hand.

Guide: [Files and storage](/vms/storage).

## `limanix network`

<!-- @include: ../../.reference/cli.md#limanix-network-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-network-usage -->

:::

`limanix network` without a subcommand prints its help.

### `limanix network setup`

<!-- @include: ../../.reference/cli.md#limanix-network-setup-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-network-setup-usage -->

:::

Only a guest whose architecture differs from the Mac's needs it: that guest runs with QEMU on Lima's shared network. Run it as your regular user in an interactive terminal. It checks the existing setup and, when something must be installed, shows the paths and asks before it runs `sudo`:

| Item               | Path                                 |
| ------------------ | ------------------------------------ |
| Network helper     | `/opt/socket_vmnet/bin/socket_vmnet` |
| Lima sudoers rules | `/private/etc/sudoers.d/lima`        |

An existing helper must pass the checks; an existing sudoers file is backed up before it is replaced. `create` and `update` of a QEMU guest offer the same installation in an interactive terminal; without one they fail with `socket_vmnet setup is required; run limanix network setup in an interactive terminal`. Automatic setup supports only Lima's standard helper, runtime and sudoers paths.

Guide: [Resources and architecture](/vms/resources).

### `limanix network check`

<!-- @include: ../../.reference/cli.md#limanix-network-check-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-network-check-usage -->

:::

<!-- @include: ../../.reference/cli.md#limanix-network-check-arguments -->

<!-- @include: ../../.reference/cli.md#limanix-network-check -->

The checks run in this order:

<!-- @include: ../../.reference/cli.md#limanix-network-check-checks -->

`--json` prints an object with these fields:

<!-- @include: ../../.reference/cli.md#limanix-network-check-json -->

::: code-group

```sh [Mac]
limanix network check dev-box 8080
```

:::

Guide: [Network](/vms/network).

## `limanix modules`

<!-- @include: ../../.reference/cli.md#limanix-modules-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-modules-usage -->

:::

`limanix modules` without a subcommand is a usage error.

### `limanix modules list`

<!-- @include: ../../.reference/cli.md#limanix-modules-list-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-modules-list-usage -->

:::

<!-- @include: ../../.reference/cli.md#limanix-modules-list -->

Each row shows a selector, its kind and its description, or the error of an imported module that fails the registry checks: modules first, then toolchains, then shell components. The kind says where `limanix.toml` chooses the entry:

| Kind         | Chosen in                                                |
| ------------ | -------------------------------------------------------- |
| `modules`    | `[nixos] modules`, by selector, such as `lmx:docker`.    |
| `toolchains` | `[toolchains]`, by line: `lmx:go-1.27` is `go = "1.27"`. |
| `shell`      | `[shell]`.                                               |

The list comes from the catalog built into the client and from your imported modules. It does not download anything or evaluate Nix code. `--json` prints an array of objects with these fields:

<!-- @include: ../../.reference/cli.md#limanix-modules-list-json -->

Guide: [The catalog](/modules/).

### `limanix modules add`

<!-- @include: ../../.reference/cli.md#limanix-modules-add-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-modules-add-usage -->

:::

<!-- @include: ../../.reference/cli.md#limanix-modules-add-arguments -->

`add` copies the whole directory, hidden files included, into the module registry and prints:

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-modules-add-output -->

:::

Select it in `limanix.toml` as `third-party:NAME`.

- It checks the structure, not the Nix code: errors in the code appear when a VM is built.
- Symlinks and special files inside the directory are rejected.
- An existing name is refused. Remove the module first to import a new version.
- Later edits to the source directory do not reach the copy.

Guide: [Your own modules](/modules/custom).

### `limanix modules remove`

<!-- @include: ../../.reference/cli.md#limanix-modules-remove-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-modules-remove-usage -->

:::

<!-- @include: ../../.reference/cli.md#limanix-modules-remove-arguments -->

`remove` prints:

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-modules-remove-output -->

:::

It removes only imported modules; the `lmx:` modules belong to the client. A VM that selects the module keeps its current system, but its next `create` or `update` fails until you import the module again or remove the selector.

Guide: [Your own modules](/modules/custom).

## `limanix first-config`

<!-- @include: ../../.reference/cli.md#limanix-first-config-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-first-config-usage -->

:::

<!-- @include: ../../.reference/cli.md#limanix-first-config-arguments -->

`first-config` writes the [defaults](/reference/config#defaults) with a comment for each setting, then prints:

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-first-config-output -->

:::

It does not create missing directories.

Guide: [The limanix.toml file](/config/).

## `limanix help`

<!-- @include: ../../.reference/cli.md#limanix-help-about -->

::: code-group

<!-- @include: ../../.reference/cli.md#limanix-help-usage -->

:::

<!-- @include: ../../.reference/cli.md#limanix-help-arguments -->
