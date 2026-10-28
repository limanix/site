---
description: Open a project in a VM from VS Code, Cursor, Zed or a JetBrains IDE on the Mac over SSH.
---

# Editors and IDEs

Your editor on the Mac opens a project in a VM over SSH: VS Code, Cursor and other editors based on
VS Code, Zed, and JetBrains IDEs. The window stays on the Mac. The editor's server, its extensions
and the language servers run in the VM, next to your toolchains and the project's Linux
dependencies.

## Set up SSH once

1. Add this line at the top of `~/.ssh/config`, before any `Host` block:

   ::: code-group

   ```text [~/.ssh/config]
   Include "~/Library/Application Support/Limanix/ssh/config"
   ```

   :::

   If you set `LIMANIX_HOME`, the file is `ssh/config` in that folder: write its full path in the
   line. Editors started from the Dock do not see the variables of your shell. See
   [Paths and ports](/reference/paths).

2. Each VM is now the host `NAME.limanix`, such as `dev-box.limanix`. Check it from the Mac:

   ::: code-group

   ```sh [Mac]
   ssh dev-box.limanix
   ```

   :::

You log in as `user.name`, in its home `user.home`, like with `limanix shell`. LimaNix keeps the SSH
settings of your VMs in that included file and updates it when you create, update, start or delete
a VM. A host keeps its port when the VM restarts; [SSH ports](/reference/paths#ssh-ports) explains
how each VM gets one.

::: info
The VM must be running. A VM created with an earlier `limanix` gets its host after
`limanix update`.
:::

## VS Code and Cursor

1. Install the Remote - SSH extension: Microsoft's in VS Code, Anysphere's in Cursor.
2. Run **Remote-SSH: Connect to Host…** and choose `dev-box.limanix`.
3. Open the project at its path in the VM, such as `/workspace`.

Or open it from a terminal on the Mac:

::: code-group

```sh [Mac]
code --remote ssh-remote+dev-box.limanix /workspace
```

:::

The first connection installs the editor's server in your home in the VM. Extensions that you
install in the remote window run in the VM too.

## Zed

Open the project with Zed's command, or with **Connect to Server** on the start screen:

::: code-group

```sh [Mac]
zed ssh://dev-box.limanix/workspace
```

:::

Zed uses the language servers of your toolchains and downloads others into the VM.

## JetBrains IDEs

1. In GoLand, PyCharm, IntelliJ IDEA, RustRover or JetBrains Gateway, choose **Remote Development**,
   then **SSH**.
2. Create a connection with the user `user.name` and the host `dev-box.limanix`. The IDE reads the
   port and the key from the SSH settings.
3. Pick the IDE for the VM and the project path, such as `/workspace`.

The IDE downloads its backend into your home in the VM and opens a client window on the Mac.

## What runs where

<div class="parts">

- **On the Mac**\
  The editor window, its settings and the client.
- **In the VM**\
  The editor's server, extensions, language servers, terminals, toolchains and builds.

</div>

The editor's server and caches live in your home in the VM, which is the managed home on the Mac:
they survive `limanix update`. Projects you share with the VM appear at their target, such as
`/workspace`; see [Shared folders](/config/mounts).

Servers of editors are programs built for other Linux systems. Every VM runs them with
[nix-ld](https://github.com/nix-community/nix-ld), which provides the common libraries they load.

## If something fails

| Case                                                                  | Next step                                                                                                                                                                           |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Could not resolve hostname dev-box.limanix`                          | Add the `Include` line at the top of `~/.ssh/config`. A VM created with an earlier `limanix` needs `limanix update` first.                                                          |
| `Connection refused`                                                  | The VM is stopped: `limanix start dev-box`.                                                                                                                                         |
| `limanix start` fails because the SSH port is in use                  | Another program on the Mac took the VM's port. `limanix update` moves the VM to a free port and updates the file.                                                                   |
| An extension's tool fails with `error while loading shared libraries` | The tool needs a library the VM does not provide. Add it to `programs.nix-ld.libraries` in [your own module](/modules/custom), such as `programs.nix-ld.libraries = [ pkgs.icu ];`. |
