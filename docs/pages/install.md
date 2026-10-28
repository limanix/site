---
description: Requirements, download, installation, updates and removal of the limanix client on macOS.
---

# Install

LimaNix is one binary for your Mac, `limanix`. It includes Lima and the module catalog: you don't install Lima or Nix separately.

:::: info Requirements
macOS 26 or newer on an Apple Silicon or Intel Mac. To check, run:

::: code-group

```sh [Mac]
sw_vers -productVersion  # 26.0 or newer
uname -m                 # arm64 on Apple Silicon, x86_64 on Intel
```

:::

Run LimaNix as your normal user, without `sudo`. Creating a VM needs network access for its base image and Nix packages.
::::

## Download

[Download](https://limanix.dev/download) the binary for your Mac, or get it from [GitHub releases](https://github.com/limanix/client/releases).

## Install the binary

For a binary saved in `~/Downloads`:

::: code-group

```sh [Apple Silicon]
mkdir -p ~/.local/bin
install -m 755 ~/Downloads/limanix-arm64 ~/.local/bin/limanix
```

```sh [Intel]
mkdir -p ~/.local/bin
install -m 755 ~/Downloads/limanix-amd64 ~/.local/bin/limanix
```

:::

Adjust the path if you saved the file elsewhere.

## Add it to your PATH

::: code-group

```sh [Mac]
export PATH="$HOME/.local/bin:$PATH"
```

:::

The line applies to the current terminal. Add it to your shell's startup file to keep `~/.local/bin` in `PATH` for new terminal sessions.

## Check the installation

::: code-group

```sh [Mac]
limanix --version
limanix --help
```

:::

`--version` prints the client version, and `--help` lists the commands.

::: warning macOS may block the first run
The binary has an ad-hoc signature with the virtualization entitlement, and Apple has not notarized it. Check that it came from limanix.dev or the GitHub releases, then allow it in

<span class="settings-path">System Settings › Privacy & Security</span>
:::

## Update the client

Download the new binary and run the same `install` command; it replaces the old one. Each client bundles its own catalog release, and existing VMs keep their system until you apply their file with the new client:

::: code-group

```sh [Mac]
limanix update --config ~/projects/my-project/limanix.toml
```

:::

The update restarts the VM. [Changing a VM](/vms/update) explains what it does.

## Remove LimaNix

::: warning
Removing the binary does not remove your VMs.
:::

Delete every VM first. `delete` stops a running VM, removes its disk and keeps its home on the Mac:

::: code-group

```sh [Mac]
for vm in $(limanix list -q); do
  limanix delete "$vm"
done
```

:::

Add `--remove-home` after `"$vm"` to remove the homes too; LimaNix can no longer remove a home after its VM is deleted. Then remove the binary:

::: code-group

```sh [Mac]
rm ~/.local/bin/limanix
```

:::

These stay on your Mac; [Paths and ports](/reference/paths) describes each folder:

| What                                                                                   | Where                                                                  |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Homes that `limanix delete` kept                                                       | Under `home.root`, `~/.limanix` by default; `delete` printed each path |
| LimaNix state, such as imported modules and records of kept homes                      | `~/Library/Application Support/Limanix`, or `LIMANIX_HOME` when set    |
| Your `limanix.toml` files and project folders                                          | Where you keep them                                                    |
| The network helper and Lima's sudoers rules, if `limanix network setup` installed them | `/opt/socket_vmnet/bin/socket_vmnet` and `/private/etc/sudoers.d/lima` |
