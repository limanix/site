---
description: Install Go, Rust, Python, Node.js, Java, C and C++ with their language servers and build tools.
---

# Toolchains

The `[toolchains]` table installs one version of each language you need, with its language server and build tools.

::: code-group

```toml [limanix.toml]
[toolchains]
go = "1.27"
rust = "stable"
python = "3.15"
nodejs = "26"
java = "21"
gradle = "9"
gcc = "15"
```

:::

Leave a key out, or set it to `""`, to install none of that language. Apply a change with `limanix update --config limanix.toml`; see [Changing a VM](/vms/update).

## What each key installs

| Key      | Value                        | Module guide               |
| -------- | ---------------------------- | -------------------------- |
| `go`     | A version line               | [Go](/modules/go)          |
| `rust`   | A channel or a version       | [Rust](/modules/rust)      |
| `python` | A version line               | [Python](/modules/python)  |
| `nodejs` | A version line               | [Node.js](/modules/nodejs) |
| `java`   | A version line               | [Java](/modules/java)      |
| `maven`  | A version line; needs `java` | [Maven](/modules/maven)    |
| `gradle` | A version line; needs `java` | [Gradle](/modules/gradle)  |
| `gcc`    | A version line               | [GCC](/modules/gcc)        |
| `clang`  | A version line; brings GCC   | [Clang](/modules/clang)    |

The module guides list the installed tools, supported lines and examples.
[Languages](/inside/languages) covers working with projects in the VM.

## Version lines

A line is a release series.
For example, `go = "1.27"` selects the 1.27 line.
The pages of [Go](/modules/go#versions), [Python](/modules/python#versions), [Node.js](/modules/nodejs#versions), [Java](/modules/java#versions), [Maven](/modules/maven#versions), [Gradle](/modules/gradle#versions), [GCC](/modules/gcc#versions) and [Clang](/modules/clang#versions) list the lines of the published catalog.

The catalog comes with your `limanix` client. List the lines it has on the Mac:

::: code-group

```sh [Mac]
limanix modules list
```

:::

Each line appears as a row of kind `toolchains`, such as `lmx:go-1.27`. A line the catalog does not have fails `limanix create` or `limanix update` with the lines it has. An end-of-life line prints a warning when the VM is built.

## Rust channels and versions

`rust` sets the default rustup toolchain, such as `stable`, `nightly` or a release number.
See [Rust](/modules/rust#toolchains) for accepted values, downloads and project overrides.

## Java and its build tools

`maven` and `gradle` run on the JDK that `java` selects and need `java` in the same table:

::: code-group

```toml [limanix.toml]
[toolchains]
java = "21"
maven = "3"
gradle = "9"
```

:::

Without `java`, `limanix create` and `limanix update` stop with `toolchains.gradle: needs a JDK`. Maven and Gradle can be selected together. A Gradle line that does not support the selected Java line stops the VM build with a message that names both; [Gradle](/modules/gradle#versions) shows which Java each line runs on.

`JAVA_HOME` points to the selected JDK. The JDK is also registered at `/usr/lib/jvm`, where Gradle, `./gradlew` and IDEs look for installed JDKs. Frameworks such as Quarkus are modules; see [Quarkus](/modules/quarkus).

## C and C++

`gcc` installs GCC with GDB, clangd, Binutils, `make`, CMake, Ninja, Meson, `pkg-config` and the Autotools. `clang` adds Clang, LLDB, clang-format and clang-tidy next to GCC, which it brings; `cc` and `c++` stay GCC.

::: code-group

```toml [limanix.toml]
[toolchains]
gcc = "15"
clang = "22"

[nixos]
packages = ["openssl"]
```

:::

With `gcc`, the packages in `[nixos] packages` come with their headers, and the compilers, `pkg-config` and CMake find them without extra flags. Python packages that compile C code and Node.js native addons build the same way; node-gyp also needs `python`. See [Native libraries](/inside/languages#native-libraries).

## Language servers in the editor

With `editor = "astronvim"`, the default of the terminal preset, AstroNvim turns on the language server of each toolchain: gopls, rust-analyzer, Pyright, the TypeScript language server, jdtls and clangd. Its plugins and syntax parsers come with the VM instead of downloading when the editor first starts.

With `editor = "neovim"` or `"none"`, the language servers are still installed for any editor that speaks the Language Server Protocol. Plain Neovim needs your own LSP configuration; see [Shell](/config/shell#choose-an-editor).

Open the project at its path in the VM, such as `/workspace`, for the language servers to see its Linux dependencies.

## Keep Go on the installed version

Go can download another toolchain when a project requires it.
See [Go toolchain downloads](/modules/go#toolchain-downloads) to control this with `GOTOOLCHAIN`.
