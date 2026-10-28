---
description: LimaNix runs NixOS development machines on your Mac, declared in one TOML file.
---

# What is LimaNix?

LimaNix runs Linux development machines on your Mac. You describe a virtual machine in one file, `limanix.toml`, and the `limanix` command creates it: a NixOS system with your shell, languages, services and packages.

LimaNix is for developers on a Mac who want their tools and services to run on Linux while the editor and project files stay on the Mac. You don't need to know Nix, and you don't install Lima or Nix on the Mac.

<LimanixOverview />

## Why LimaNix

- **One file declares the machine.** [`limanix.toml`](/config/) lives beside your project and lists the resources, shared folders, shell, toolchains, modules and packages.
- **Updates build before the VM restarts.** When a build fails, the VM keeps the system it had. [How it works](/architecture) shows the steps.
- **Modules fit together.** Shell components, toolchains and services share one theme, and each toolchain connects its language server to the editor. See [the catalog](/modules/).
- **Your files stay on the Mac.** Project folders and your VM home live on the Mac and survive updates. See [Files and storage](/vms/storage).

## What's in the box

<div class="parts">

- [`limanix`](/vms/)\
  One binary for the Mac, with Lima built in, that creates, updates, starts, stops and deletes VMs and opens a shell in them.
- [`lmx`](/inside/lmx)\
  Status, checks and help inside the VM.
- [Shell](/config/shell)\
  The login shell, prompt, terminal editor, multiplexer and command-line tools, from a full preset or a minimal one.
- [Toolchains](/config/toolchains)\
  The languages you need, each at the version you choose, with its build tools and language server.
- [Modules](/modules/)\
  Services and tools configured for you, from databases and containers to cloud CLIs and coding agents.
- [Packages](/config/modules#install-packages)\
  Any command from nixpkgs, or a newer release from nixos-unstable.
- [Editors and IDEs](/vms/editors)\
  Your editor stays on the Mac and opens the project in the VM over SSH.
- [Shared folders](/config/mounts) and [dotfiles](/config/dotfiles)\
  Your project and your settings from the Mac, in every VM.
- [Clipboard](/inside/clipboard)\
  `pbcopy` and `pbpaste` in the VM copy to and paste from the Mac clipboard.
- [Network](/vms/network)\
  Reach services at the VM's address, and check why a port does not answer.

</div>

## Get started

[Install the client](/install), then create your first VM with the [Quick start](/quick-start).
