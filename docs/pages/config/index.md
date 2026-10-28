---
description: How limanix.toml is laid out, what each table configures and what a VM gets for the settings you leave out.
---

# The limanix.toml file

A `limanix.toml` file describes one VM: its resources, your account, the shell, languages, modules, shared folders and environment. This page shows where the file lives, how it is laid out and what the VM gets for settings you leave out.

## Where the file lives

Keep `limanix.toml` in your project folder: it can travel with the project in Git, and `"."` in it is the project folder. Pass its path to `create` and `update`:

::: code-group

```sh [Mac]
limanix create --config ~/projects/my-project/limanix.toml
```

:::

`limanix create` and `limanix update` need `--config` and read the VM name from the file. The other commands take the name directly, such as `limanix shell dev-box`.

Relative paths in the file resolve from the folder that holds `limanix.toml`, wherever you run the command.

Editing the file changes nothing by itself. Apply it with `limanix update --config limanix.toml`, which restarts the VM; see [Changing a VM](/vms/update). `limanix start` boots the VM as it was, without reading the file.

## The tables at a glance

| In the file                    | Configures                                             | Page                                                                   |
| ------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `schema_version`, `name`       | The file format version and the VM name                | [Below](#schema-version-and-name)                                      |
| `[resources]`                  | Architecture, CPUs, memory and disk                    | [Resources and architecture](/vms/resources)                           |
| `[user]`                       | Your account in the VM                                 | [Environment and theme](/config/environment#set-up-your-account)       |
| `[home]`                       | Where your home folder in the VM is kept on the Mac    | [Files and storage](/vms/storage)                                      |
| `[shell]`                      | Shell preset, prompt, editor, multiplexer and dotfiles | [Shell](/config/shell), [Dotfiles](/config/dotfiles)                   |
| `[toolchains]`                 | Go, Rust, Python, Node.js, Java, C and C++             | [Toolchains](/config/toolchains)                                       |
| `[nixos]`                      | Catalog modules and packages                           | [Modules and packages](/config/modules)                                |
| `[theme]`                      | Colors                                                 | [Environment and theme](/config/environment#choose-a-theme)            |
| `[network]`, `[network.ports]` | Network mode and firewall ports                        | [Network](/vms/network)                                                |
| `[env]`                        | Environment variables                                  | [Environment and theme](/config/environment#set-environment-variables) |
| `[[mounts]]`                   | Shared folders                                         | [Shared folders](/config/mounts)                                       |

The [limanix.toml reference](/reference/config) lists every key with its type and default.

## TOML basics

The file uses TOML. In the [project example](#example-files) below:

| In the file         | Meaning                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| `name = "dev-box"`  | A top-level setting; top-level settings come before the first table       |
| `[resources]`       | A table; it holds the settings below it, up to the next table header      |
| `[network.ports]`   | A table inside `network`                                                  |
| `[[mounts]]`        | One entry in the list of shared folders; repeat the block for each folder |
| `tcp = [8080]`      | A list in square brackets                                                 |
| `# Save this file…` | A comment                                                                 |

Values have types: `cpu = 4` is an integer, `sudo = true` a boolean and `mem = "8GiB"` a string. LimaNix rejects unknown keys and wrong types, and the error names the key. This catches typos such as `cpus` for `cpu` in `[resources]`.

## Schema version and name

::: code-group

```toml [limanix.toml]
schema_version = 1
name = "dev-box"
```

:::

`schema_version` is the version of the file format, not of the client. `1` is the only version, and a file without it is read as version 1.

`name` is the VM's name; without it, the VM is called `example-box`.

> A name has 1 to 63 lowercase letters, digits and hyphens, and starts and ends with a letter or digit.

::: warning
Changing `name` in the file points the file at a different VM; it does not rename the existing one.
:::

## Settings you leave out

A setting you leave out keeps its default. The defaults add nothing you did not ask for: no shared folders, environment variables or open ports.

| Your file                         | What the VM gets                                                           |
| --------------------------------- | -------------------------------------------------------------------------- |
| No `arch` in `[resources]`        | Your Mac's architecture: `arm64` on Apple Silicon, `amd64` on Intel        |
| No `[[mounts]]`                   | No shared folders besides your home folder                                 |
| No `[env]` table                  | No environment variables                                                   |
| No `tcp` in `[network.ports]`     | No TCP ports from this setting; modules can still open their own           |
| No `[shell]` table                | The `terminal` preset with Pure, AstroNvim and tmux                        |
| `preset = "minimal"` alone        | Bash and the CLI tools; `prompt`, `editor` and `multiplexer` become `none` |
| No `[toolchains]` table           | No toolchains                                                              |
| No `dotfiles`                     | No dotfiles                                                                |
| No `modules`                      | No optional modules; the shell and toolchains still apply                  |
| No `packages`                     | No extra packages; the shell preset still brings Git and its CLI tools     |
| `[resources]` with only `cpu = 2` | Two CPUs; the architecture, memory and disk keep their defaults            |
| No `[theme]` table                | The `system` flavor: your terminal's own colors                            |

An empty string is a value, not a default: `source = ""` is an error, and `APP_ENV = ""` sets an empty variable.

## Example files

Three starting points. Save one as `limanix.toml` in your project folder and change what you need:

| Example   | What it sets up                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| Project   | Your project at `/workspace`, TCP port 8080 open and `APP_ENV` set, on 4 CPUs, 8 GiB of memory and a 10 GiB disk            |
| Minimal   | Bash and the CLI tools on 2 CPUs, 4 GiB of memory and a 16 GiB disk, with no shared folder, modules or open ports           |
| Workbench | Go, Python and Node.js, Docker, Posting, Harlequin, `kubectl` and `k9s`, and your project at `/workspace`, on a 40 GiB disk |

::: code-group

```toml [Project]
# Save this file in your project directory as limanix.toml.
name = "dev-box"

[resources]
cpu = 4
mem = "8GiB"
disk = "10GiB"

[shell]
preset = "terminal"

[network.ports]
tcp = [8080]

[env]
APP_ENV = "development"

[[mounts]]
source = "."
target = "/workspace"
mode = "rw"
```

```toml [Minimal]
name = "dev-box"

[resources]
cpu = 2
mem = "4GiB"
disk = "16GiB"

[shell]
preset = "minimal"
```

```toml [Workbench]
name = "dev-box"

[resources]
disk = "40GiB"

[toolchains]
go = "1.27"
python = "3.15"
nodejs = "26"

[nixos]
modules = ["lmx:docker", "lmx:posting", "lmx:harlequin"]
packages = ["kubectl", "k9s"]

[[mounts]]
source = "."
target = "/workspace"
```

:::

`limanix first-config` writes a `limanix.toml` with every setting at its default and a comment for each, in the folder you name or the current one:

::: code-group

```sh [Mac]
limanix first-config ~/projects/my-project
```

:::

::: warning
`first-config` overwrites a `limanix.toml` that is already in the folder.
:::
