---
description: Every table and key of limanix.toml, with its type, allowed values and default.
---

# limanix.toml

`limanix.toml` describes one VM. `limanix create` and `limanix update` read it on the Mac; editing the file changes nothing until you run one of them. [The limanix.toml file](/config/) explains the layout with examples.

## File rules

- The file is TOML in UTF-8. Top-level keys come before the first table.
- Unknown keys and wrong types are rejected, including typos such as `resources.cpus`.
- An omitted key keeps its default, listed in [Defaults](#defaults).
- An empty string does not ask for a default: `source = ""` is an error, while `APP_ENV = ""` is an empty value.
- An error names the key without its value, such as `limanix: resources.cpu: must be positive`.

## Top-level keys

::: code-group

```toml [limanix.toml]
schema_version = 1
name = "dev-box"
```

:::

<!-- @include: ../../.reference/config.md#config-top -->

[`[env]`](#env) and [`[[mounts]]`](#mounts) have their own sections below.

Guide: [The limanix.toml file](/config/).

## `[user]`

The regular account inside the guest and its sudo access.

::: code-group

```toml [limanix.toml]
[user]
name = "dev"
home = "/home/dev"
sudo = true
```

:::

<!-- @include: ../../.reference/config.md#config-user -->

`name` and `home` are [fixed at creation](#fixed-at-creation). The account uses the numeric UID of your Mac account for shared files; its name can differ from your Mac account's name.

Guide: [Environment and theme](/config/environment).

## `[resources]`

Guest architecture and compute resources.

::: code-group

```toml [limanix.toml]
[resources]
cpu = 4
mem = "8GiB"
disk = "10GiB"
```

:::

<!-- @include: ../../.reference/config.md#config-resources -->

A size is a positive whole number followed by `GiB`, such as `"8GiB"`. `"8GB"`, `"1.5GiB"`, `"0GiB"` and `"08GiB"` are rejected. `arch` is [fixed at creation](#fixed-at-creation).

Guide: [Resources and architecture](/vms/resources).

## `[home]`

Storage on the Mac for the home directory of the guest user.

::: code-group

```toml [limanix.toml]
[home]
root = "~/.limanix"
```

:::

<!-- @include: ../../.reference/config.md#config-home -->

`root` is [fixed at creation](#fixed-at-creation). `limanix create` prints the path of the managed home, and `limanix list --json` shows it in `home`.

Guide: [Files and storage](/vms/storage).

## `[shell]`

Shell, prompt, editor and multiplexer of the development account.

::: code-group

```toml [limanix.toml]
[shell]
preset = "terminal"
prompt = "pure"
editor = "astronvim"
multiplexer = "tmux"
dotfiles = "~/dotfiles"
```

:::

<!-- @include: ../../.reference/config.md#config-shell -->

`none` leaves a component out of the VM. With `preset = "minimal"`, the defaults of `prompt`, `editor` and `multiplexer` are `none`; name an editor or a multiplexer to add it.

Guides: [Shell](/config/shell), [Dotfiles](/config/dotfiles).

## `[toolchains]`

Language toolchains, one version each. An empty or omitted key installs none.

::: code-group

```toml [limanix.toml]
[toolchains]
go = "1.27"
rust = "stable"
python = "3.14"
nodejs = "26"
java = "21"
gradle = "9"
```

:::

<!-- @include: ../../.reference/config.md#config-toolchains -->

A line is a version such as `1.27` and must exist in the catalog of your client: `limanix modules list` shows each line as a selector of kind `toolchains`, such as `lmx:go-1.27`. An unknown line fails with the lines the catalog has. `maven` or `gradle` without `java` fails with `toolchains.gradle: needs a JDK: add java to [toolchains], such as java = "21"`.

Guide: [Toolchains](/config/toolchains).

## `[nixos]`

Modules that configure the guest system, and packages to install.

::: code-group

```toml [limanix.toml]
[nixos]
modules = ["lmx:docker"]
packages = ["jq", "unstable:kubernetes-helm"]
```

:::

<!-- @include: ../../.reference/config.md#config-nixos -->

`[shell]` and `[toolchains]` choose the other catalog modules. A shell component or a toolchain in `modules` fails with the table that chooses it, such as `nixos.modules[0]: lmx:go is a toolchain; choose its version in [toolchains], such as go = "1.27"`. The `terminal` preset also installs the GitHub CLI, `gh`; a package of the same name in `packages` takes its place.

Guides: [Modules and packages](/config/modules), [The catalog](/modules/).

## `[theme]`

Colors of the guest.

::: code-group

```toml [limanix.toml]
[theme]
flavor = "system"
```

:::

<!-- @include: ../../.reference/config.md#config-theme -->

Guide: [Environment and theme](/config/environment).

## `[network]`

Guest network.

::: code-group

```toml [limanix.toml]
[network]
mode = "shared"
```

:::

<!-- @include: ../../.reference/config.md#config-network -->

Guide: [Network](/vms/network).

## `[network.ports]`

Inbound ports of the guest firewall.

::: code-group

```toml [limanix.toml]
[network.ports]
tcp = [8080]
udp = []
```

:::

<!-- @include: ../../.reference/config.md#config-network-ports -->

A port is an integer from 1 to 65535. The lists only open the firewall: they do not start services or forward ports of the Mac, and `localhost` on the Mac does not reach them. Selected modules can open ports of their own, also when the lists are empty.

Guide: [Network](/vms/network).

## `[env]`

Guest-wide environment for login sessions and for system and user services.

::: code-group

```toml [limanix.toml]
[env]
APP_ENV = "development"
APP_PORT = "8080"
```

:::

| Key    | Type   | Default | Description                                                                                                                                                                                                                                          |
| ------ | ------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NAME` | string | none    | The environment variable `NAME`. A name has ASCII letters, digits and `_`, and does not start with a digit. A value is a string, also for numbers, and may be empty. Values are literal: `"$TOKEN"` is the text `$TOKEN`, not a variable of the Mac. |

Without `env` in the file, the guest gets no variables.

The values are plaintext. They are written to runtime files and installed under `/etc/limanix`, readable by root and by the development account's group. They stay outside the Nix store, but this is not encrypted secret storage.

Guide: [Environment and theme](/config/environment).

## `[[mounts]]`

Directories of the Mac mounted inside the guest. Each `[[mounts]]` block is one shared folder.

::: code-group

```toml [limanix.toml]
[[mounts]]
source = "."
target = "/workspace"
mode = "rw"
```

:::

<!-- @include: ../../.reference/config.md#config-mounts -->

- Targets cannot overlap: `/workspace` and `/workspace/cache` cannot both be targets.
- A target cannot be `user.home` or a directory above it. A target inside the home, such as `/home/dev/.config/nvim`, is allowed.
- Without `[[mounts]]` in the file, the guest has no shared folders. The managed home is mounted in any case.

A read-write mount shares the same files with the Mac: a change or a deletion on either side changes both.

Guide: [Shared folders](/config/mounts).

## Host paths

`home.root`, `shell.dotfiles` and `mounts.source` are paths on the Mac.

- A leading `~` is your home on the Mac. `$HOME` and other variables stay literal.
- A relative path is resolved from the directory of `limanix.toml`, not from the directory where you run the command. For a symlinked `limanix.toml`, the directory of the real file counts. Symlinks inside the path are resolved.

## Guest paths

`user.home` and `mounts.target` are paths inside the VM.

- A path is absolute, starts with a single `/` and is not `/` itself.
- It contains no spaces, tabs, line breaks, `:` or `..` components. Repeated slashes and `.` components are normalized.
- These destinations and everything below them are reserved for the guest system: `/etc`, `/boot`, `/usr`, `/var`, `/nix`, `/run`, `/dev`, `/proc`, `/sys`, `/bin`, `/sbin`, `/mnt/limanix`, `/mnt/dotfiles` and `/home/limanix-admin`. `/home` is not available either: it would cover `/home/limanix-admin`.

## Fixed at creation

| Key                                                     | Behavior                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| `resources.arch`, `user.name`, `user.home`, `home.root` | `update` rejects a change. Create a new VM and copy the files you need. |
| `resources.disk`                                        | `update` can raise it. It cannot shrink.                                |
| `name`                                                  | Another name selects another VM.                                        |

Every other key changes with `limanix update`, which restarts the VM.

## Defaults

[`limanix first-config`](/reference/cli#limanix-first-config) writes this file: every setting with its default and a comment, and the empty `dotfiles` and toolchain keys as commented-out examples. An empty `limanix.toml` gives the same settings. On an Intel Mac, `arch` is `"amd64"`.

::: code-group

<!-- @include: ../../.reference/config.md#config-example -->

:::

The defaults share no folders and set no environment variables.
