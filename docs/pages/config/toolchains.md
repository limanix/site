---
description: Install programming languages with their language servers and build tools.
---

# Toolchains

The `[toolchains]` table installs one version of each language you need, with its language server and build tools. One key brings the compiler, the build tools and the editor support together, in every VM made from the file. For a single tool, use `packages` or `nix shell`; [Profile or limanix.toml](/inside/packages#profile-or-limanix-toml) compares the options.

::: code-group

```toml [limanix.toml]
[toolchains]
go     = "1.27"
rust   = "stable"
python = "3.15"
nodejs = "26"
java   = "21"
gradle = "9"
gcc    = "15"
```

:::

Leave a key out, or set it to `""`, to install none of that language. Apply a change with `limanix update --config limanix.toml`; see [Changing a VM](/vms/update).

Each key is a toolchain of the catalog, with a page on what it installs, its lines and examples; [the catalog](/modules/#toolchains) lists them. [Languages](/inside/languages) covers working with projects in the VM.

## Version lines

A line is a release series: `go = "1.27"` selects the 1.27 line. `rust` takes a rustup channel or a Rust version instead, such as `stable`. Each module page lists the lines of the published catalog.

The catalog comes with your `limanix` client. List the lines it has on the Mac:

::: code-group

```sh [Mac]
limanix modules list
```

:::

- Each line is a row of kind `toolchains`, such as `lmx:go-1.27`.
- A line the catalog does not have stops `limanix create` or `limanix update`, and the error lists the lines it has.
- An end-of-life line still builds, with a warning.

## Language servers {#language-servers-in-the-editor}

With `editor = "astronvim"`, the default of the terminal preset, AstroNvim turns on the language server of each toolchain. Its plugins and syntax parsers come with the VM instead of downloading when the editor first starts.

With `editor = "neovim"` or `"none"`, the language servers are still installed for any editor that speaks the Language Server Protocol. Plain Neovim needs your own LSP configuration; see [Shell](/config/shell#choose-an-editor).

Open the project at its path in the VM, such as `/workspace`, for the language servers to see its Linux dependencies.
