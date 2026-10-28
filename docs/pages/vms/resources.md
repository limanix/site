---
description: Set the CPU, memory, disk and guest architecture of a VM.
---

# Resources and architecture

`[resources]` sets how many CPUs, how much memory and how large a disk a VM gets, and the
architecture of its Linux system. The defaults fit a shell, an editor and the builds of one project.

## Set resources

::: code-group

```toml [limanix.toml]
[resources]
cpu = 4
mem = "8GiB"
disk = "40GiB"
```

:::

| Setting | Value                                                    | Default    |
| ------- | -------------------------------------------------------- | ---------- |
| `cpu`   | Number of virtual CPUs, a positive whole number          | `4`        |
| `mem`   | Memory in whole GiB, as a quoted string such as `"8GiB"` | `"8GiB"`   |
| `disk`  | Size of the guest disk in whole GiB, such as `"40GiB"`   | `"10GiB"`  |
| `arch`  | Guest architecture: `arm64` or `amd64`                   | Your Mac's |

`GiB` is the only unit: `"8GB"`, `"1.5GiB"`, `"0GiB"` and `"08GiB"` are rejected. A setting you
leave out keeps its default: `[resources]` with only `cpu = 2` keeps the default memory, disk and
architecture.

Raise a setting when your work needs it:

- `cpu` for parallel builds and test runs;
- `mem` for Docker, Kubernetes and large builds;
- `disk` for Docker images and volumes, Kubernetes clusters and build caches.

`disk` sizes only the guest disk: the managed home and shared folders live on the Mac; see
[Files and storage](/vms/storage). In the VM, `lmx welcome` shows the CPUs, the memory and the free
disk space.

## Change resources

Edit `[resources]` and run `limanix update --config limanix.toml`. The update stops a running VM,
applies the new sizes and starts it again; see [Changing a VM](/vms/update).

| Setting      | With `update`                                                          |
| ------------ | ---------------------------------------------------------------------- |
| `cpu`, `mem` | Can go up or down                                                      |
| `disk`       | Can only grow; a smaller size is rejected                              |
| `arch`       | Fixed when the VM is created; create a new VM for another architecture |

`update` compares `disk` with the disk's actual size, which an earlier failed update may already
have grown.

## Guest architecture

A guest of your Mac's architecture is the default: `arm64` on Apple Silicon, `amd64` on Intel. Set
`arch` to the other one only when you need it, such as for a program without a build for your Mac's
architecture, or to match the servers where your code runs.

<div class="parts">

- **Your Mac's architecture**
  - runs on Apple Virtualization at native speed
  - shares folders with virtiofs
  - uses the native NAT of Apple Virtualization
  - needs nothing on the Mac
- **The other architecture**
  - runs in QEMU, which emulates the processor and is much slower
  - shares folders with 9p, which is slower than virtiofs
  - uses Lima's shared network through `socket_vmnet`
  - needs QEMU and a one-time network setup; see [Set up QEMU](#set-up-qemu)

</div>

::: warning Use the Apple Silicon build of limanix
On an Apple Silicon Mac, run the Apple Silicon `limanix`, also for an Intel guest. VM commands
refuse the Intel build running through Rosetta; see
[Troubleshooting](/troubleshooting#mac-checks-fail).
:::

LimaNix spells the architectures `arm64` and `amd64`, not Nix's `aarch64` and `x86_64`.

## Set up QEMU

A guest of the other architecture needs two things on the Mac. Prepare them before you create the
VM:

1. QEMU, with the emulator for the guest in your `PATH`: `qemu-system-x86_64` for `amd64`,
   `qemu-system-aarch64` for `arm64`. For example, with Homebrew:

   ::: code-group

   ```sh [Mac]
   brew install qemu
   ```

   :::

2. The network helper and Lima's sudoers rules. macOS lets only root create the network that a QEMU
   guest uses: the helper, `socket_vmnet`, runs as root, and the sudoers rules let Lima start and
   stop it with each VM without asking for your password. Run this as your regular Mac user, in an
   interactive terminal:

   ::: code-group

   ```sh [Mac]
   limanix network setup
   ```

   :::

   The command checks the existing setup. When something is missing, it shows what it installs and
   asks before it runs `sudo`:

   | Item                   | Location                             |
   | ---------------------- | ------------------------------------ |
   | Bundled network helper | `/opt/socket_vmnet/bin/socket_vmnet` |
   | Lima sudoers rules     | `/private/etc/sudoers.d/lima`        |

   An existing sudoers file is backed up before it is replaced. LimaNix and QEMU keep running as
   your user.

`limanix create` and `limanix update` of such a guest offer the same installation in an interactive
terminal; in a script, they stop and report that the setup is required.
[Troubleshooting](/troubleshooting#another-architecture)
lists their messages.
