---
description: Build, test and edit Go, Rust, Python, Node.js, Java, C and C++ projects inside a VM.
---

# Languages

Each toolchain you choose in the `[toolchains]` table of `limanix.toml` installs a language with its build tools and its language server. This page shows how to use them inside the VM. To choose a language or its version, see [Toolchains](/config/toolchains).

## See what a toolchain installed

::: code-group

```sh [VM]
lmx help go
```

:::

The card shows the installed version, the commands on your `PATH` and common tasks. The topics are `go`, `rust`, `python`, `nodejs`, `java`, `maven`, `gradle`, `gcc` and `clang`.

The module pages describe the installed tools and their use:

## Go

See [Go](/modules/go#use) for building, testing, cgo, debugging and toolchain downloads.

## Rust

See [Rust](/modules/rust#toolchains) for the first download, project toolchains and updates.
The [use examples](/modules/rust#use) cover Cargo, formatting and Clippy.

## Python

See [Python](/modules/python#use) for virtual environments and project dependencies.
The page also explains interpreter changes and Pyright configuration.
Wheels with native code, such as NumPy, load as on other Linux systems; see [Binary wheels and native code](/modules/python#binary-wheels-and-native-code).

## Node.js

See [Node.js](/modules/nodejs#use) for npm and [native dependencies](/modules/nodejs#native-dependencies) for packages that compile code.

## Java

See [Java](/modules/java#use) for compiling and running classes, and [other JDKs](/modules/java#other-tools-and-jdks) for tools that look for a JDK or download one.
Build projects with [Maven](/modules/maven#use) or [Gradle](/modules/gradle#use); both run on the selected JDK.

## C and C++

See [GCC](/modules/gcc#use) for compiling, CMake and GDB, and [Clang](/modules/clang#use) for Clang, clang-format and clang-tidy.
clangd reads `compile_commands.json`, which CMake writes with `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON`.

## Language servers in AstroNvim

AstroNvim uses the language servers of your selected toolchains.
Open the project at its path in the VM, such as `/workspace`, where its Linux dependencies are available.
See [AstroNvim language servers](/modules/astronvim#language-servers) for configuration and [packages and state](/modules/astronvim#packages-and-state) for syntax parsers.
Plain [Neovim](/modules/neovim#language-servers) needs your own LSP configuration.

## Native libraries

Code that links to a C library needs that library and its headers: a Go package with cgo, a crate such as `openssl-sys`, a Python package with a native extension or a Node.js native addon. Select `gcc` in `[toolchains]` and add the library to `[nixos] packages`:

::: code-group

```toml [limanix.toml]
[toolchains]
gcc = "15"

[nixos]
packages = ["openssl", "libpq"]
```

:::

The library comes with its headers. The compilers, `pkg-config` and CMake find it without extra flags, and the programs they build find it when they run. node-gyp also needs Python: add `python` to `[toolchains]`. Go and Rust bring a GCC of their own, which does not search `[nixos] packages`. See [Native libraries](/modules/gcc#native-libraries) for the details.
