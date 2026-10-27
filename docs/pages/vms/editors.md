---
description: Open a project in a VM from VS Code, Cursor, Zed or a JetBrains IDE on the Mac over SSH.
---

# Connect an editor from the Mac

Editors on the Mac open a project in a VM over SSH: VS Code, Cursor and other editors based on VS
Code, Zed, and JetBrains IDEs. The window stays on the Mac. The editor's server, its extensions and
the language servers run in the VM, next to your toolchains and the project's Linux dependencies.

## Set up SSH once

LimaNix keeps the SSH settings of your VMs in one file on the Mac. Add this line at the top of
`~/.ssh/config`, before any `Host` block:

::: code-group

```text [~/.ssh/config]
Include "~/Library/Application Support/Limanix/ssh/config"
```

:::

With `LIMANIX_HOME` set, include `$LIMANIX_HOME/ssh/config` instead. Each VM is then the host
`NAME.limanix`, such as `dev-box.limanix`. Check it from the Mac:

::: code-group

```sh [Mac]
ssh dev-box.limanix
```

:::

You log in as the user from `[user]` in `limanix.toml`, in that user's home, like with
`limanix shell`. The VM must be running. The host keeps its port when the VM restarts, and LimaNix
updates the file when you create, update, start or delete a VM. A VM created with an earlier
`limanix` gets its host after `limanix update --config limanix.toml`.

## VS Code and Cursor

Install the Remote - SSH extension: Microsoft's in VS Code, Anysphere's in Cursor. Run
**Remote-SSH: Connect to Host…**, choose `dev-box.limanix` and open the project at its path in the
VM, such as `/workspace`. From a terminal on the Mac:

::: code-group

```sh [Mac]
code --remote ssh-remote+dev-box.limanix /workspace
```

:::

The first connection installs the editor's server in your home in the VM. Extensions that you
install in the remote window run in the VM too.

## Zed

Open the project with Zed's command or with **Connect to Server** on the start screen:

::: code-group

```sh [Mac]
zed ssh://dev-box.limanix/workspace
```

:::

Zed uses the language servers of your toolchains and downloads others into the VM.

## JetBrains IDEs

In GoLand, PyCharm, IntelliJ IDEA, RustRover or JetBrains Gateway, choose **Remote Development**,
then **SSH**, and create a connection with the user from `[user]`, `dev` by default, and the host
`dev-box.limanix`. The IDE reads the port and the key from the SSH settings. Pick the IDE for the
VM and the project path, such as `/workspace`. The IDE downloads its backend into your home in the
VM and opens a client window on the Mac.

## What runs where

| On the Mac                                     | In the VM                                                                           |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| The editor window, its settings and the client | The editor's server, extensions, language servers, terminals, toolchains and builds |

The editor's server and caches live in your home in the VM, which is the managed home on the Mac:
they survive `limanix update`. Projects you share with the VM appear at their target, such as
`/workspace`; see [Shared folders](/config/mounts).

Servers of editors are programs built for other Linux systems. Every VM runs them with
[nix-ld](https://github.com/nix-community/nix-ld), which provides the common libraries they load.

## When something does not work

| Case                                                                  | Next step                                                                                                                                                                           |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Could not resolve hostname dev-box.limanix`                          | Add the `Include` line at the top of `~/.ssh/config`. A VM created with an earlier `limanix` needs `limanix update --config limanix.toml` first.                                    |
| `Connection refused`                                                  | The VM is stopped: `limanix start dev-box`.                                                                                                                                         |
| `limanix start` fails because the SSH port is in use                  | Another program on the Mac took the VM's port. `limanix update --config limanix.toml` moves the VM to a free port and updates the file.                                             |
| An extension's tool fails with `error while loading shared libraries` | The tool needs a library the VM does not provide. Add it to `programs.nix-ld.libraries` in [your own module](/modules/custom), such as `programs.nix-ld.libraries = [ pkgs.icu ];`. |
