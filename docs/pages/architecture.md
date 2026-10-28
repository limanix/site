---
description: What runs on the Mac and in the VM, how limanix reaches a VM, how a change in limanix.toml reaches it, and where LimaNix keeps its state.
---

# How it works

LimaNix is one program on your Mac, `limanix`, and a NixOS system in each VM that it builds from your `limanix.toml`. This page shows what runs where, how `limanix` reaches a VM, how a change reaches it and what happens when a step fails.

## What runs where

<LimanixOverview variant="parts" />

<div class="parts">

- **`limanix`**\
  The command on the Mac. It reads `limanix.toml`, prepares each new system and runs every VM command; see [the limanix command](/reference/cli).
- **Lima**\
  Runs the VM: Apple Virtualization for a guest of your Mac's architecture, QEMU for the other one. While a VM runs, a `limanix` process stays in the background as [Lima's](https://lima-vm.io) host agent.
- **The catalog**\
  NixOS modules for the shell, toolchains and services, pinned to one nixpkgs revision. Each `limanix` carries one [catalog](/modules/) release, and a new VM first boots from its base image.
- **NixOS**\
  The system of the VM. The VM builds it from your file, the catalog and your own modules.
- **`lmx`**\
  The command in the VM, for you and for `limanix`: the welcome, status, checks, help, the dotfile links and the Mac clipboard; see [the lmx command](/inside/lmx).
- **`lmxd`**\
  A root daemon under systemd. It builds each new system, checks it after the restart, removes the older one and keeps the Nix store from filling the disk.

</div>

## How limanix reaches a VM

<LimanixOverview variant="connections" />

`limanix` asks `lmx` for builds, status and checks, and reads its answers as JSON. The management account belongs to LimaNix; your shell, your files and your editors use your own account. [SSH ports](/reference/paths#ssh-ports) shows how each VM gets its port.

## How a change reaches the VM

`limanix create` and `limanix update` take the same steps. Each run builds a new generation: the complete system that your file describes.

<LimanixFlow />

Step 5 runs the `lmxd` of the new generation: a new VM, a VM made by an older client and a current VM take the same steps. A successful update leaves the VM running, even if it was stopped before. Editing `limanix.toml` alone changes nothing, and `limanix start` boots the saved system without reading the file.

## Generations

The inputs of each generation are a folder in the [state folder](/reference/paths#the-limanix-state-folder) on the Mac:

::: code-group

```text [Mac]
instances/dev-box/generations/35b2edf4547e/
├── flake/            the NixOS configuration
│   ├── flake.nix     base modules and the catalog's nixpkgs pin
│   ├── lmx.json      the lmx release to build
│   ├── runtime.json  account, shell, toolchains, ports, packages
│   └── modules/      the modules you chose, catalog and your own
├── lima.yaml         CPU, memory, disk and mounts
├── environment       [env] for services
└── environment.sh    [env] for login shells
```

:::

The VM sees the folder read-only at `/mnt/limanix` and builds its system from it. The guest disk keeps only the applied system. After a successful run, `limanix` removes the inputs of older generations; a failed run keeps its inputs for diagnosis.

## When a step fails

| What fails                                  | What happens                                                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| The check or the preparation, steps 1 and 2 | The VM keeps its system and its settings, and `create` makes no VM. Fix the file or the Mac and run the command again.                           |
| The build, steps 5 and 6                    | The VM does not restart and keeps its current system, and its own `lmxd` takes over again. The error is in the output on your Mac.               |
| The build, canceled with Ctrl-C             | `limanix` cancels the build and brings back the VM's own `lmxd`. The VM keeps the system it ran, and the command ends with status 130.           |
| A check after the restart, step 8           | The new system runs, but the command fails with `Generation … is booted but unhealthy` and the reason. `limanix doctor dev-box` shows the check. |
| Only the cleanup, step 8                    | The VM is ready with a warning, and `lmxd` tries again later.                                                                                    |

An update is not a transaction: completed steps are not undone. The VM may already be stopped, its Lima settings may have changed, or new environment files may be installed. Fix the cause and run `limanix update` again; [Troubleshooting](/troubleshooting) covers each case.

## Where state lives

Three folders on the Mac hold everything outside the VMs: the state folder with the generations, Lima's folder with the guest disks, and the managed homes. [Paths and ports](/reference/paths) lists what each holds, and [Files and storage](/vms/storage) what each command keeps.

A lock per VM keeps two commands from changing the same VM at once; `limanix shell` does not take it. `limanix list --json` reports Lima's power state and the last LimaNix operation as separate values. `LIMANIX_HOME` and `LIMA_HOME` do not move existing VMs: use the same values whenever you work with them.
