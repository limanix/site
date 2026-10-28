---
description: Add catalog modules, your own modules and packages from nixpkgs to a VM.
---

# Modules and packages

The `[nixos]` table adds software beyond the shell and the toolchains. `modules` selects modules from the LimaNix catalog or your own, and `packages` installs programs from [nixpkgs](https://search.nixos.org/packages), the Nix package collection.

::: code-group

```toml [limanix.toml]
[nixos]
modules  = ["lmx:docker"]
packages = ["kubectl", "k9s", "unstable:kubernetes-helm"]
```

:::

Apply a change with `limanix update --config limanix.toml`; see [Changing a VM](/vms/update).

## Package or module

A package installs a program that works on its own. A module is NixOS configuration: choose one when a program needs more than its package.

| A module                                                | For example                                  |
| ------------------------------------------------------- | -------------------------------------------- |
| Starts a service, or creates a user or a group          | `lmx:docker` runs Docker Engine as a service |
| Writes configuration you would otherwise write yourself | `lmx:posting` in the VM's theme              |
| Keeps several versions side by side                     | `lmx:postgres-16` with `lmx:postgres-18`     |
| Changes a tool's own behavior                           | `lmx:claude` turns off its self-updates      |

[The catalog](/modules/#modules) lists the modules, each with a page on what it installs, its lines and how to use it.

## Select modules

| Selector           | Selects                                                 | Example             |
| ------------------ | ------------------------------------------------------- | ------------------- |
| `lmx:NAME`         | A catalog module, at its default line when it has lines | `lmx:docker`        |
| `lmx:NAME-VERSION` | A specific line of a catalog module                     | `lmx:postgres-16`   |
| `third-party:NAME` | Your own module, imported with `limanix modules add`    | `third-party:redis` |

The catalog comes with your `limanix` client. List what it has on the Mac:

::: code-group

```sh [Mac]
limanix modules list
```

:::

Each row shows a selector, its kind and a description. `modules` takes the selectors of kind `modules`. The [shell](/config/shell) and [toolchains](/config/toolchains) tables choose the other kinds, and a selector of theirs in `modules` fails with a message that names the table:

::: code-group

```text [Mac]
nixos.modules[0]: lmx:go is a toolchain; choose its version in [toolchains], such as go = "1.27"
```

:::

An explicit line replaces the module's default line. Several lines of one module work where the module supports them, as PostgreSQL does:

::: code-group

```toml [limanix.toml]
[nixos]
modules = ["lmx:postgres-16", "lmx:postgres-18"]
```

:::

Modules that allow one line, such as Docker, stop the build when you select two.

## Your own module

When the catalog has no module for what you need, write one: a folder with a `default.nix`, a NixOS module like the ones in the catalog. This one runs Redis as a service:

::: code-group

```nix [~/limanix-modules/redis/default.nix]
{ ... }:
{
  services.redis.servers.dev = {
    enable = true;
    port = 6379;
  };
}
```

:::

1. Import the folder on the Mac under a name:

   ::: code-group

   ```sh [Mac]
   limanix modules add redis ~/limanix-modules/redis
   ```

   :::

2. Select it as `third-party:redis` and apply the file with `limanix update --config limanix.toml`:

   ::: code-group

   ```toml [limanix.toml]
   [nixos]
   modules = ["third-party:redis"]
   ```

   :::

3. Check it in the VM. The service runs as `redis-dev`, and NixOS installs `redis-cli` with it:

   ::: code-group

   ```console [VM]
   $ redis-cli ping
   PONG
   ```

   :::

The import is a copy: after you change the module, remove it, add it again and update each VM that uses it. [Your own modules](/modules/custom) covers names, what a module can use and help cards; [NixOS options](https://search.nixos.org/options) lists the settings a module can set.

## Install packages

List packages by their attribute path in nixpkgs, such as `kubectl` or `python3Packages.ipython`. Find names on [search.nixos.org](https://search.nixos.org/packages), in the channel of the VM's NixOS release; `nixos-version` in the VM shows it.

- **`unstable:`** `unstable:NAME` takes the package from the catalog's nixos-unstable revision, for tools whose release in the VM's NixOS is too old, such as `unstable:kubernetes-helm` or `unstable:codex`. Search them in the `unstable` channel. The revision moves with each catalog release.
- **Libraries.** A language library such as `python3Packages.requests` installs but cannot be imported: use the project's environment, such as a venv, or a module. A C library such as `openssl` gives the compilers its headers when `gcc` is in `[toolchains]`; see [GCC](/modules/gcc).
- **Licenses.** Naming a package accepts its license, even an unfree one. The acceptance uses the last part of the name. When the package's own name differs, the build error names it, and your own module can allow it with `nixpkgs.config.allowUnfreePackages`.
- **Conflicts.** When a listed package provides a command that another package of the VM also provides, the build fails and names both. The same package is no conflict: `jq` beside the CLI tools, which install it, is fine. With the terminal preset, listing `gh` or `unstable:gh` replaces the preset's GitHub CLI.
- **Versions.** One version of a tool per list. Choose language versions in [`[toolchains]`](/config/toolchains), and several versions of a service with module lines.

A name that is not a package, or a conflict, fails `limanix create` or `limanix update` before the VM restarts. The output gives the reason, and the VM keeps its current system. Fix the file and run the update again.

To try a tool in one VM without editing the file, see [Packages on the fly](/inside/packages).
