---
description: Answers to common questions about LimaNix, from supported Macs to files, updates and containers.
---

# FAQ

## Is LimaNix free?

Yes. LimaNix is open source under the Apache License 2.0. The source is on [GitHub](https://github.com/limanix).

## Which Macs does it support?

Apple Silicon and Intel Macs with macOS 26 or newer. See [Install](/install).

## Do I need to know Nix?

No. `limanix.toml` covers the shell, toolchains, modules and packages. When you need more, a NixOS module of your own plugs into the same VM; see [Your own modules](/modules/custom).

## Do I install Lima or Nix?

No. Lima is built into `limanix`, and Nix runs inside the VM. Only a guest of the other architecture, such as an Intel guest on Apple Silicon, needs QEMU on the Mac; see [Resources and architecture](/vms/resources).

## How is it different from Lima?

LimaNix runs its VMs with Lima, built into `limanix`. On top, it adds:

- a NixOS system built from your `limanix.toml`;
- a catalog of modules that work together;
- updates that build before the VM restarts.

[How it works](/architecture) shows the parts.

## Can I run containers?

Yes. Add Docker to the modules, and Docker Engine with Compose runs inside the VM:

::: code-group

```toml [limanix.toml]
[nixos]
modules = ["lmx:docker"]
```

:::

Images, containers and volumes live on the VM's disk, which `limanix delete` removes. See [Docker](/modules/docker).

## Where do my files live?

| What                           | Where                                                |
| ------------------------------ | ---------------------------------------------------- |
| Your project folders           | On the Mac, shared into the VM                       |
| Your home in the VM            | On the Mac; it survives updates and `limanix delete` |
| The system and everything else | On the VM's disk                                     |

See [Files and storage](/vms/storage).

## Can I use my Mac editor?

Yes. VS Code, Cursor, Zed and JetBrains IDEs open a project in the VM over SSH. The window stays on the Mac, and the language servers see the project's Linux dependencies. After one line in `~/.ssh/config`, each VM is an SSH host:

::: code-group

```sh [Mac]
code --remote ssh-remote+dev-box.limanix /workspace
```

:::

See [Connect an editor from the Mac](/vms/editors). You can also edit a shared project folder on the Mac directly while builds and tests run in the VM; see [Shared folders](/config/mounts).

## How do I add a package?

Name it in `[nixos] packages`, then apply the file:

::: code-group

```toml [limanix.toml]
[nixos]
packages = ["tree"]
```

:::

::: code-group

```sh [Mac]
limanix update --config ~/projects/my-project/limanix.toml
```

:::

To try a tool without changing the file, run it with `nix shell` in the VM:

::: code-group

```sh [VM]
nix shell nixpkgs#tree
```

:::

See [Modules and packages](/config/modules#install-packages) and [Packages on the fly](/inside/packages).

## When do my edits apply?

When you run `limanix update`. Editing `limanix.toml` changes nothing by itself:

::: code-group

```sh [Mac]
limanix update --config ~/projects/my-project/limanix.toml
```

:::

`update` applies the file and restarts the VM. `limanix start` boots the saved system without reading the file. See [Changing a VM](/vms/update).

## What if an update fails?

The VM keeps its current system and does not restart into the new one. The build error appears on your Mac: fix the file and run `limanix update` again.

Earlier steps are not undone: the VM's Lima settings may have changed and new `[env]` values may be installed. See [Troubleshooting](/troubleshooting).

## How do I reach a server?

1. Open its port in `limanix.toml` and run `limanix update`:

   ::: code-group

   ```toml [limanix.toml]
   [network.ports]
   tcp = [8080]
   ```

   :::

2. Make the server listen on `0.0.0.0`, not only on `127.0.0.1`.
3. Connect to the VM's address from `limanix list`, such as `http://ADDRESS:8080`. LimaNix does not forward ports to the Mac's `localhost`.

See [Network](/vms/network).

## Can I script LimaNix?

Yes. Results go to standard output, and errors and build output to standard error. `-q` prints only names, and `--json` prints results as JSON:

::: code-group

```sh [Mac]
for vm in $(limanix list -q); do
  limanix stop "$vm"
done

limanix start dev-box --json | jq -r .address
```

:::

See [Use LimaNix in scripts](/vms/#use-limanix-in-scripts).

## What does delete keep?

Your home in the VM, your `limanix.toml` and your project folders stay on the Mac; the VM's disk is removed. `--remove-home` removes the home too:

::: code-group

```sh [Mac]
limanix delete dev-box                # keeps the home
limanix delete dev-box --remove-home  # removes it too
```

:::

A new VM gets a new, empty home: copy what you need from the old one. See [Files and storage](/vms/storage).
