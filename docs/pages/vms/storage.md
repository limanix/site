---
description: Where the files of a VM live, what deleting it removes and how its disk keeps free space.
---

# Files and storage

A VM keeps files on its own disk, in a home folder on your Mac, and in the folders you share with
it: your projects and your dotfiles. This page shows which is which, what each command keeps, and
how the guest disk keeps free space.

<LimanixOverview variant="storage" />

## Where your files live

| Place                                                      | Where the files are                                                                                                                                                      | After `limanix delete`                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| [Guest disk](#the-guest-disk)                              | A disk image in `~/.lima`, seen only in the VM: NixOS and data written outside mounts                                                                                    | Removed                                                     |
| [Managed home](#the-managed-home)                          | On the Mac beneath `~/.limanix`; appears read-write at `user.home` inside the VM                                                                                         | Kept by default; `--remove-home` removes it                 |
| [Project folders](/config/mounts)                          | Folders of your Mac, such as your project at `/workspace`: as many as you list in `[[mounts]]`, each read-write (`rw`) or read-only (`ro`) in the VM                     | Kept on the Mac                                             |
| [Dotfiles](/config/dotfiles)                               | Your dotfiles folder on the Mac, read-write at `/mnt/dotfiles` in the VM; each interactive Bash or Zsh shell of the development account links its entries into your home | Kept on the Mac                                             |
| [LimaNix state](/reference/paths#the-limanix-state-folder) | The record of each VM in `~/Library/Application Support/Limanix`; none of your files                                                                                     | The VM's record is removed; the record of a kept home stays |

<div class="parts">

- [Your files](/config/mounts#changes-in-the-vm-change-the-mac)\
  Shared with the VM: an edit or a deletion on either side changes the same file. A mount is not a
  backup.
  - the managed home
  - the dotfiles folder
  - project folders with `mode = "rw"`
- [LimaNix files](/reference/paths)\
  `limanix` keeps them in step with your VMs: do not change them by hand.
  - `~/.lima`: guest disks and Lima settings
  - `~/Library/Application Support/Limanix`: the record of each VM

</div>

## The guest disk

The guest disk holds NixOS, the Nix store and every file outside the shared folders, including
service data under `/var`, such as Docker images and volumes. It keeps only the NixOS system the VM
runs; each update removes the older ones. Its size is `disk` in `[resources]`; see
[Resources and architecture](/vms/resources).

## The managed home

Each VM gets its own home folder on the Mac, at `<home.root>/<name>-<id>`, and sees it at
`user.home`. With the defaults, the home of `dev-box` could be `~/.limanix/dev-box-a1b2c3d4e5f6`,
mounted at `/home/dev`:

::: code-group

```toml [limanix.toml]
[user]
home = "/home/dev"

[home]
root = "~/.limanix"
```

:::

The suffix is generated: `limanix create` prints the actual path, and `limanix list --json` shows
it in `home`:

::: code-group

```sh [Mac]
limanix list --json | jq -r '.[] | select(.name == "dev-box").home'
```

:::

The home holds your files and caches. With `dotfiles` in `[shell]`, it
also holds links to the files of your dotfiles folder, which stay on the Mac; see
[Dotfiles](/config/dotfiles). A relative `root` is resolved from the folder of `limanix.toml`, and `~` is
the home of your Mac account. `home.root` and `user.home` cannot change after the VM is created.

## What each command keeps

| Command                             | Guest disk            | Managed home               | Shared folders                  |
| ----------------------------------- | --------------------- | -------------------------- | ------------------------------- |
| `stop`, `start`                     | Kept                  | Kept                       | Kept                            |
| `update`                            | Kept and reconfigured | Kept                       | Kept; mount settings can change |
| `delete`, with or without `--force` | Removed               | Kept                       | Kept                            |
| `delete --remove-home`              | Removed               | Removed with all its files | Kept                            |

::: warning
LimaNix has no snapshot or backup command. Before you delete a VM:

- keep `limanix.toml` and your module folders;
- back up the home and project folders you need;
- export data that lives only on the guest disk, such as databases or Docker volumes.

The file recreates the system, not your data.
:::

## Recreate a VM

After a delete, `limanix create --config limanix.toml` creates a new VM from the same file, with a
new, empty managed home. The old home stays at the path that `delete` printed, and LimaNix does not
attach it again. Copy the files you need into the new home or a project folder.

Once the VM is deleted, `limanix delete --remove-home` can no longer remove its old home. Keep the
printed path and remove that folder yourself when you no longer need it.

## Keep the disk free

The VM cleans its Nix store by itself:

| Free space on the guest disk | What happens                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Less than 20%                | The `lmxd` daemon removes store paths that nothing uses anymore. It checks every 15 minutes and also cleans up after each update. |
| Less than 10%                | The welcome and `lmx status` warn, `lmxd` logs what still holds space, and `limanix update` warns before it starts.               |

Low space never blocks an update. `limanix list` shows the used share of the disk in `DISK`; inside
the VM, `lmx info` shows it too.

The cleanup never deletes what is still in use: the running system, garbage-collector roots such as
`nix-direnv` shells and `result` links from `nix build`, and data outside the Nix store, such as
Docker images and volumes under `/var/lib/docker`.

### Make room

When the disk stays full, look at what holds space in the VM:

::: code-group

```sh [VM]
lmx info
sudo lmx logs roots
```

:::

`lmx info` shows the usage. `sudo lmx logs roots` shows the roots that `lmxd` logged when less than
10% was free; `sudo nix-store --gc --print-roots` lists the roots now. Remove what you no longer
need, such as an old `result` link, a project's `.direnv` folder or Docker data with
`docker system prune`. Then collect the store paths they kept:

::: code-group

```sh [VM]
sudo lmx store reserve
```

:::

The command collects right away when less than 20% is free, waits for the collection and prints the
usage before and after. `sudo nix-store --gc` collects whatever the free space.

If that is not enough, raise `disk` in `[resources]` and run `limanix update` on the Mac.
Other versions of your `nix profile` can keep removed tools in the Nix store.
`nix profile wipe-history` deletes those profile versions; garbage collection can then remove store paths that nothing else uses.
See [Packages on the fly](/inside/packages).
