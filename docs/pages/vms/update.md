---
description: Apply an edited limanix.toml to an existing VM with limanix update.
---

# Changing a VM

Editing `limanix.toml` does not change a VM, and neither does installing a new `limanix` binary.
`limanix update` applies the file to the VM and restarts it.

## Apply a change

::: warning
The update restarts the VM and ends its sessions and services. Save your work in the VM first.
:::

Edit `limanix.toml` and apply it:

::: code-group

```sh [Mac]
limanix update --config ~/projects/my-project/limanix.toml
```

:::

`update` finds the VM by `name` in the file. When it succeeds, check the tool or service you
changed, and start again any service that you run by hand.

## What an update does

Each update gives the VM a new generation: the complete system that your `limanix.toml` describes.

1. The Mac checks the file and prepares the new generation.
2. A running VM keeps running. A stopped VM, or one whose disk or memory grows, gets the new Lima
   settings and starts.
3. The VM builds the new generation while its current system runs, and you can keep working in it.
   The build output appears in your terminal.
4. After a successful build, the VM restarts into the new generation with its new CPU, memory and
   mounts.
5. The VM checks its system services, shared folders and your account, then removes the older
   generations.
6. The update marks the VM `ready` in `limanix list`.

A running VM restarts once, after the build, and a stopped VM boots for the build and then restarts.
A larger disk or more memory applies before the build, because the build may need it: a running VM
then restarts before the build too. A successful update leaves the VM running, even when it was
stopped before. Before the build, the VM makes room in its Nix store; a nearly full disk causes a
warning, not a failure. See [Files and storage](/vms/storage#keep-the-disk-free).

## What can change

An update keeps the VM itself: its guest disk, its managed home and your shared folders.

<div class="parts">

- **Can change**
  - CPU and memory, and a larger disk
  - The shell, toolchains, modules and packages
  - Dotfiles, theme and environment
  - Ports and mounts
  - `user.sudo`
- **Fixed at creation**
  - `resources.arch`: the guest architecture
  - `user.name` and `user.home`: your account in the VM
  - `home.root`: the folder on the Mac that holds the managed home

</div>

An update that changes a fixed setting fails with
`an update cannot change architecture, username, or managed-home paths`. Revert the change, or
create a new VM and copy the files you need.

The disk can grow but not shrink: `update` rejects a `disk` smaller than the disk's actual size,
which an earlier failed update may already have grown. See
[Resources and architecture](/vms/resources).

## When an update fails

A build error, such as a package name that does not exist, stops the update before the restart. The
VM keeps its current system and environment files, and the reason is in the output. To read it
again:

- `limanix list` shows the saved error under the VM's row;
- `sudo lmx logs apply` in the VM shows the whole build output.

Fix the file and run `limanix update` again.

An update does not undo the steps it finished before it failed. A VM that was stopped, or whose disk
or memory grows, keeps the Lima settings it got before the build, and a failed restart can leave the
VM stopped. `limanix list` shows `error` in `STATE`, and `limanix start` does not clear it: `start`
boots the current system with the saved settings and does not read your corrected file. Run
`limanix update` again instead. It applies the file before it starts a stopped VM, which also helps
when the VM no longer starts with its old settings.

If the new generation boots but fails its checks, the update reports
`Generation … is booted but unhealthy` with the reason, and `limanix doctor dev-box` shows the
failing check. [Troubleshooting](/troubleshooting) covers the other errors.

## Cancel an update

Press Ctrl-C while `limanix update` builds. The build stops, the VM keeps running the generation it
ran before, and the command exits with status 130. If the build had already finished, the new
generation stays built and the VM boots it at its next restart; run `limanix update` again to
finish.

## A warning after success

`VM 'dev-box' is ready, but lmx reported: Finalizing generation … failed` means the new generation
runs, but the older ones could not be removed yet. The VM tries again after 15 minutes. Inside the
VM, `sudo lmx logs finalize` shows why the removal failed.

## Notices in the VM

When a built generation waits for a restart, the welcome in the VM shows a line such as:

::: code-group

```text [VM]
▲ restart  generation 4a1f9c2 is built; run limanix update on the Mac
```

:::

A short word also appears in tmux's status line, or outside tmux in a
[catalog prompt](/config/prompts):

| Word       | Meaning                                                | What to do                                          |
| ---------- | ------------------------------------------------------ | --------------------------------------------------- |
| `apply`    | The Mac handed over a generation that is not built yet | Run `limanix update` on the Mac                     |
| `applying` | An update is building right now                        | Wait for `limanix update` to finish                 |
| `restart`  | A new generation is built and waits for a restart      | Run `limanix update` on the Mac; it restarts the VM |

`lmx status` and `lmx doctor` in the VM show the same state; see [The lmx command](/inside/lmx).
