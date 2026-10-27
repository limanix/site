---
description: Install Go, Rust, Python and Node.js with their language servers.
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
```

:::

Leave a key out, or set it to `""`, to install none of that language. Apply a change with `limanix update --config limanix.toml`; see [Changing a VM](/vms/update).

## What each key installs

| Key      | Value                  | Module guide               |
| -------- | ---------------------- | -------------------------- |
| `go`     | A version line         | [Go](/modules/go)          |
| `rust`   | A channel or a version | [Rust](/modules/rust)      |
| `python` | A version line         | [Python](/modules/python)  |
| `nodejs` | A version line         | [Node.js](/modules/nodejs) |

The module guides list the installed tools, supported lines and examples.
[Languages](/inside/languages) covers working with projects in the VM.

## Go, Python and Node.js lines

A line is a release series.
For example, `go = "1.27"` selects the 1.27 line.
The [Go](/modules/go#versions), [Python](/modules/python#versions) and [Node.js](/modules/nodejs#versions) pages list the lines of the published catalog.

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

## Language servers in the editor

With `editor = "astronvim"`, the default of the terminal preset, AstroNvim turns on the language server of each toolchain: gopls, rust-analyzer, Pyright and the TypeScript language server. Its plugins and syntax parsers come with the VM instead of downloading when the editor first starts.

With `editor = "neovim"` or `"none"`, the language servers are still installed for any editor that speaks the Language Server Protocol. Plain Neovim needs your own LSP configuration; see [Shell](/config/shell#choose-an-editor).

Open the project at its path in the VM, such as `/workspace`, for the language servers to see its Linux dependencies.

## Keep Go on the installed version

Go can download another toolchain when a project requires it.
See [Go toolchain downloads](/modules/go#toolchain-downloads) to control this with `GOTOOLCHAIN`.
