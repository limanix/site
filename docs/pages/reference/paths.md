---
description: Where LimaNix keeps its files on the Mac, what each folder holds and how each VM gets its SSH port.
---

# Paths and ports

LimaNix keeps everything outside the VMs in four folders on your Mac, and gives
each VM an SSH port on the Mac's own address, `127.0.0.1`. Leave the folders to
the `limanix` commands, and read [Troubleshooting](/troubleshooting) before you
change anything in them by hand.

## Folders

| Folder | What it holds | Moved with |
| -- | -- | -- |
| `~/Library/Application Support/Limanix` | LimaNix state: the record of each VM, its prepared builds, imported modules and SSH settings | `LIMANIX_HOME` |
| `~/.lima` | Lima's VMs: their guest disks, Lima settings and logs, and the SSH key that `limanix` uses | `LIMA_HOME` |
| `~/.limanix` | Managed homes: your home folder in each VM | `home.root` in `limanix.toml` |
| `~/Library/Caches/lima` | Lima's download cache: the base disks that new VMs start from | Cannot be moved |

::: warning

`LIMANIX_HOME` and `LIMA_HOME` do not move existing VMs. Use the same values for
every command: other values show other VMs.

:::

## The LimaNix state folder

`limanix` creates it when it first needs it, readable only by your Mac account:

| Path | What it holds |
| -- | -- |
| `instances/NAME/identity.json` | What `create` fixes: the VM's name, ID, architecture, account and managed home |
| `instances/NAME/instance.json` | The result of the last operation, the current generation and its error |
| `instances/NAME/generations/` | The prepared inputs of each build: the NixOS configuration and the Lima settings. `current` points to the last one built |
| `modules/` | Modules imported with `limanix modules add` |
| `homes/` | Records of the managed homes that `limanix delete` kept |
| `locks/` | Locks that keep two commands from changing the same VM at once |
| `runtime/` | Lima's guest agent, unpacked from the `limanix` binary |
| `ssh/config` | SSH settings for editors; see [SSH ports](#ssh-ports) |

`limanix delete` removes the VM's folder in `instances/` and records its managed
home in `homes/`. With `--remove-home`, it removes the home and that record too,
and `limanix homes remove` does the same later.
[Install](/install#remove-limanix) lists what stays on the Mac after you remove
LimaNix.

## The image cache

Lima downloads a base disk once and keeps it in `~/Library/Caches/lima`, a few
GiB for each catalog release. On one APFS volume, a new guest disk is a clone of
the cached file and takes space only for what the VM changes:

- `du` counts the shared blocks in both folders: the guest disk looks bigger
  than the space it takes.
- `limanix delete` returns what the VM wrote, not the full size of its disk.
  `df -h ~` shows what the Mac really has free.
- A VM needs the cache only to create its disk. Removing the cache does not
  affect existing VMs.

`limanix delete` removes the cached base disks of other catalog releases. It
keeps the disks of the release that this `limanix` carries, which the next
`create` uses without a download, and it leaves other downloads alone, such as
the images of your own Lima VMs.

To free the rest, remove the folder. `limanix create` and Lima download what
they need again:

::: code-group

```sh [Mac]
du -sh ~/Library/Caches/lima
rm -rf ~/Library/Caches/lima
```

:::

## SSH ports

Each VM gets its own SSH port on `127.0.0.1`, between 42022 and 49151, below the
range that macOS hands out to programs:

- `create` takes the first port that no other VM uses and no other program
  holds.
- `update` keeps the VM's port while it is free, and moves the VM to a free one
  when another program holds it.
- `start` keeps the port. When another program holds it, `start` fails: run
  `limanix update` to move the VM.

`ssh/config` names each VM `NAME.limanix`, with its port, its account and Lima's
key:

::: code-group

```text [ssh/config]
Host dev-box.limanix
  HostName 127.0.0.1
  Port 42022
  User dev
  IdentityFile "/Users/you/.lima/_config/user"
  IdentitiesOnly yes
  PreferredAuthentications publickey
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
  LogLevel ERROR
```

:::

Host keys are not checked for these hosts: a VM that you create again gets a new
key on the same local address. `limanix` rewrites the file after `create`,
`update`, `start` and `delete`, and your changes in it are lost. Include it in
`~/.ssh/config` with its full path; see [Editors and IDEs](/vms/editors).
