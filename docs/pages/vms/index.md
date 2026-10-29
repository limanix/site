---
description: Create, start, stop, list, check and delete LimaNix VMs from your Mac.
---

# Using virtual machines

You manage each VM from your Mac with the `limanix` command, as your normal Mac user, without
`sudo`. This page follows a VM from `create` to `delete`.

## Commands

<div class="parts">

- [`limanix create`](#create-a-vm)\
  Creates a VM from `limanix.toml`, builds its NixOS system and starts it.
- [`limanix update`](/vms/update)\
  Applies your edited `limanix.toml` and restarts the VM.
- [`limanix start`](#start-and-stop)\
  Boots a stopped VM with the system it already has.
- [`limanix stop`](#start-and-stop)\
  Shuts the VM down and keeps its disk and home.
- [`limanix shell`](/vms/shell)\
  Opens a shell in the VM, or runs one command there.
- [`ssh dev-box.limanix`](/vms/editors)\
  Connects over SSH, as editors do.
- [`limanix list`](#list-your-vms)\
  Lists your VMs with their state, address and disk usage.
- [`limanix doctor`](#check-a-vm)\
  Checks a VM and tells you what to fix.
- [`limanix network check`](/vms/network)\
  Checks why the Mac cannot reach a port in the VM.
- [`limanix delete`](#delete-a-vm)\
  Deletes a VM and keeps its home on the Mac.

</div>

[limanix command](/reference/cli) lists every argument and flag.

## How names work

`create` and `update` take the VM name from `name` in `limanix.toml`. The other commands take the
name as an argument, such as `limanix start dev-box`.

::: code-group

```toml [limanix.toml]
name = "dev-box"
```

:::

> A name has 1 to 63 lowercase letters, digits and hyphens, and starts and ends with a letter or
> digit.

::: warning
Changing `name` in the file points the file at a different VM; it does not rename the existing one.
:::

## Create a VM

::: code-group

```sh [Mac]
limanix create --config ~/projects/my-project/limanix.toml
```

:::

`--config` is required. `create` then:

1. downloads the base image when needed;
2. boots the VM and builds its NixOS system from the file;
3. restarts the VM into that system;
4. prints the VM name and the path of its managed home on the Mac.

The first run needs network access for the image and the packages. `create` refuses a name that
already has a VM; change that VM with `limanix update` instead. To write the file, start with
[The limanix.toml file](/config/).

## Start and stop

::: code-group

```sh [Mac]
limanix stop dev-box
limanix start dev-box
```

:::

`stop` shuts the VM down and keeps its disk and managed home. `start` boots the system the VM
already has: it does not read `limanix.toml` or apply your changes. Use `limanix update` for that.

## List your VMs

::: code-group

```sh [Mac]
limanix list
```

:::

| Column    | Shows                                                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NAME`    | The VM name                                                                                                                                        |
| `STATUS`  | The power state from Lima, such as `Running` or `Stopped`; `Missing` when Lima has no VM for the record                                            |
| `STATE`   | The result of the last create, update or delete: `ready`, `error`, `interrupted` or `corrupt`; `creating`, `updating` or `deleting` while one runs |
| `ADDRESS` | The VM's IPv4 address; see [Network](/vms/network)                                                                                                 |
| `DISK`    | How much of the guest disk is used; see [Files and storage](/vms/storage)                                                                          |

A `-` in `ADDRESS` or `DISK` means the VM is stopped, did not answer within 10 seconds, or has no
address on the shared network. A line under a row names an error or a notice. For scripts,
`limanix list -q` prints only the names and `limanix list --json` the same values as JSON; see
[Use LimaNix in scripts](#use-limanix-in-scripts).

`STATE` is a saved result, not a live check: `Stopped` with `ready` means the last create or update
succeeded and the VM was stopped afterwards. Starting or stopping a VM does not reset an `error`.
[Troubleshooting](/troubleshooting) explains `error`, `interrupted`, `Missing` and `corrupt`.

## Check a VM

::: code-group

```sh [Mac]
limanix doctor dev-box
```

:::

`doctor` prints one row per check: its status, `ok`, `warning`, `failed` or `unknown`, its name and
a message, with a hint under each row that needs attention.

<!-- @include: ../../.reference/cli.md#limanix-doctor-checks -->

A stopped VM, or one that another command is changing, shows only `vm`. The command exits with
status 1 when a check failed. `doctor` repairs nothing and does not restart the VM. Inside the VM,
`lmx doctor` runs the guest's checks; see [The lmx command](/inside/lmx).

## Delete a VM

::: code-group

```sh [Mac]
limanix delete dev-box                # keeps the home
limanix delete dev-box --remove-home  # removes it too
```

:::

`delete` stops the VM if it runs, then removes its disk and its saved record. The managed home stays
on the Mac unless you add `--remove-home`, and the command prints its path. Your `limanix.toml` and
shared project folders stay too. `delete` also cleans up a VM that Lima no longer has.

::: warning
`delete` does not ask for confirmation. Save what you need from the guest disk first; see
[Files and storage](/vms/storage).
:::

When deletion fails because Lima cannot stop the VM, add `--force`; it does not remove the home. To
create the VM again from the same file, see [Recreate a VM](/vms/storage#recreate-a-vm).

## Use LimaNix in scripts

Standard output carries only results: errors and the build output of `create` and `update` go to
standard error. `limanix list -q` prints only the VM names, one per line, and
`limanix modules list -q` only the selectors. Stop every VM:

::: code-group

```sh [Mac]
for vm in $(limanix list -q); do
  limanix stop "$vm"
done
```

:::

With `--json`, a command prints its result as JSON:

| Command                             | `--json` prints                                                        |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `list`                              | An array of VMs                                                        |
| `create`, `update`, `start`, `stop` | The VM, as an object of `list --json`                                  |
| `delete`                            | `name`, and `home`: the preserved home, or `null` with `--remove-home` |
| `doctor`, `network check`           | The checks                                                             |
| `modules list`                      | An array of modules                                                    |

Start a VM and read its address with `jq`, which comes with macOS:

::: code-group

```sh [Mac]
limanix start dev-box --json | jq -r .address
```

:::

A failed command prints no JSON and exits with a status other than `0`. `-q` and `--json` cannot be
combined. [limanix command](/reference/cli) lists the fields of each command.
