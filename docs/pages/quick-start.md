---
description: Install LimaNix, create a NixOS VM from limanix.toml, open a shell in it and apply a change.
---

# Quick start

This page takes you from the download to a shell in a NixOS VM, then through a change and cleanup.

:::: info Requirements
macOS 26 or newer on an Apple Silicon or Intel Mac. To check, run:

::: code-group

```sh [Mac]
sw_vers -productVersion  # 26.0 or newer
uname -m                 # arm64 on Apple Silicon, x86_64 on Intel
```

:::

::::

## Install the client

[Download](https://limanix.dev/download) the binary for your Mac, or get it from [GitHub releases](https://github.com/limanix/client/releases). Then install it:

::: code-group

```sh [Apple Silicon]
mkdir -p ~/.local/bin
install -m 755 ~/Downloads/limanix-arm64 ~/.local/bin/limanix
export PATH="$HOME/.local/bin:$PATH"
limanix --version
```

```sh [Intel]
mkdir -p ~/.local/bin
install -m 755 ~/Downloads/limanix-amd64 ~/.local/bin/limanix
export PATH="$HOME/.local/bin:$PATH"
limanix --version
```

:::

## Write limanix.toml

Save this file as `limanix.toml` in your project folder, such as `~/projects/my-project`:

::: code-group

```toml [limanix.toml]
name = "dev-box"

[resources]
cpu = 2
mem = "4GiB"
disk = "16GiB"

[shell]
preset = "minimal"
```

:::

The file declares a VM named `dev-box` with 2 CPUs, 4 GiB of memory and a 16 GiB disk, and the minimal shell: Bash with Git and the command-line tools.

[The limanix.toml file](/config/) describes every setting.

## Create the VM

::: code-group

```sh [Mac]
limanix create --config ~/projects/my-project/limanix.toml
```

:::

LimaNix downloads the base image if needed, boots the VM, builds its NixOS system and restarts the VM into it. The first run needs network access for the image and Nix packages. When it finishes, the command prints the VM name and the path of the VM's home on your Mac, under `~/.limanix`. `limanix list` now shows `dev-box` as `Running` and `ready`.

## Open a shell

::: code-group

```sh [Mac]
limanix shell dev-box
```

:::

You are `dev` in `/home/dev`, on Linux. The shell opens with a welcome from `lmx`: the VM's state, its NixOS version and architecture, CPUs, memory and free disk, its address and open ports, the shared folders and modules, and commands to try. Look around:

::: code-group

```sh [VM]
uname -s
lmx help
lmx welcome
exit
```

:::

`lmx help` lists the commands in the VM and on the Mac, and `lmx welcome` shows the welcome again. `exit` returns you to the Mac; the VM keeps running.

## Change the VM

Share your project with the VM and add a package. Add these tables at the end of `limanix.toml`:

::: code-group

```toml [limanix.toml]
[nixos]
packages = ["tree"]

[[mounts]]
source = "."
target = "/workspace"
mode = "rw"
```

:::

`.` is the folder that holds `limanix.toml`. The update restarts the VM: save any work in it, then apply the file:

::: code-group

```sh [Mac]
limanix update --config ~/projects/my-project/limanix.toml
limanix shell dev-box -- tree --version
limanix shell dev-box -- ls /workspace
```

:::

The update builds the new system first and restarts the VM only when the build succeeds. If the build fails, the VM keeps its current system and the error is in the output. In the VM, `/workspace` holds the same files as your project folder: a change or deletion on either side affects both.

## Stop, start and delete

`stop` shuts the VM down and keeps its disk and home. `start` boots the saved system; it does not read `limanix.toml`. `delete` removes the VM's disk, keeps its home on the Mac and prints the home's path; add `--remove-home` to remove the home too. Your project folder stays where it is.

::: warning
`limanix delete` does not ask for confirmation. Copy what you need from the VM first.
:::

::: code-group

```sh [Mac]
limanix stop dev-box
limanix start dev-box
limanix delete dev-box
```

:::

## Tips

<div class="parts">

- [Editors and IDEs](/vms/editors)\
  After one line in `~/.ssh/config`, each VM is an SSH host that your editor opens projects in:

  ::: code-group

  ```sh [Mac]
  ssh dev-box.limanix
  ```

  :::

- [Shell and sessions](/vms/shell)\
  Run one command in the VM from the Mac:

  ::: code-group

  ```sh [Mac]
  limanix shell dev-box -- uname -a
  ```

  :::

  With tmux, `--session work` brings you back to the same session.

- [Shell](/config/shell)\
  For Zsh, AstroNvim and tmux, choose the terminal preset:

  ::: code-group

  ```toml [limanix.toml]
  [shell]
  preset = "terminal"
  ```

  :::

- [Dotfiles](/config/dotfiles)\
  Bring your settings from the Mac into every VM:

  ::: code-group

  ```toml [limanix.toml]
  [shell]
  dotfiles = "~/dotfiles"
  ```

  :::

- [Toolchains](/config/toolchains)\
  Add a language with its build tools and language server:

  ::: code-group

  ```toml [limanix.toml]
  [toolchains]
  python = "3.15"
  ```

  :::

- [Modules](/modules/)\
  Add a service such as Docker:

  ::: code-group

  ```toml [limanix.toml]
  [nixos]
  modules = ["lmx:docker"]
  ```

  :::

  `limanix modules list` shows what else the catalog offers.

- [Packages on the fly](/inside/packages)\
  Try a tool without changing the file:

  ::: code-group

  ```sh [VM]
  nix shell nixpkgs#openssl
  ```

  :::

- [Network](/vms/network)\
  Open the port of a server in the VM:

  ::: code-group

  ```toml [limanix.toml]
  [network.ports]
  tcp = [8080]
  ```

  :::

  Connect to the VM's address from `limanix list`, not to `localhost`.

- [Scripts](/vms/#use-limanix-in-scripts)\
  `limanix list -q` prints only the VM names:

  ::: code-group

  ```sh [Mac]
  for vm in $(limanix list -q); do
    limanix stop "$vm"
  done
  ```

  :::

  With `--json`, commands print their result as JSON.

- [Troubleshooting](/troubleshooting)\
  When something looks wrong, check the VM:

  ::: code-group

  ```sh [Mac]
  limanix doctor dev-box
  ```

  :::

</div>
