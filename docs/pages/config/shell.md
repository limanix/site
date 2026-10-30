---
description: Choose the shell preset, prompt, editor and multiplexer of a VM.
---

# Shell

The `[shell]` table chooses what you work in when you open a shell in the VM: the login shell and its tools, the prompt, the editor and the terminal multiplexer. Pick the `terminal` preset to work in the VM's terminal, and `minimal` when you mostly work in an editor on the Mac.

::: code-group

```toml [limanix.toml]
[shell]
preset = "terminal"   # terminal or minimal
prompt = "pure"       # a catalog prompt or none
editor = "astronvim"  # astronvim, neovim or none
multiplexer = "tmux"  # tmux or none
```

:::

These are the defaults: a file without a `[shell]` table gets the same shell. Apply a change with `limanix update --config limanix.toml`; see [Changing a VM](/vms/update).

## Choose a preset

<div class="parts">

- **`terminal`, the default**\
  For work in the VM's terminal.
  - Zsh with Oh My Zsh
  - the Pure prompt, AstroNvim and tmux
  - Git, the CLI tools, Lazygit, Yazi and the GitHub CLI
- **`minimal`**\
  For a VM you use from an editor on the Mac: a smaller system.
  - Bash
  - no prompt, editor or multiplexer until you name one
  - Git and the CLI tools

</div>

See [CLI tools](/modules/cli-tools) for the shared commands and [Zsh](/modules/zsh) for shell features.
[The terminal](/inside/terminal) shows how to use the tools together.

`none` leaves a component out of the VM. With `minimal`, name a prompt, an editor or a multiplexer to add it:

::: code-group

```toml [limanix.toml]
[shell]
preset = "minimal"
prompt = "starship"
editor = "neovim"
```

:::

The minimal preset has no GitHub CLI: add it with `packages = ["gh"]` in [`[nixos]`](/config/modules). To keep the terminal preset with another login shell, set `limanix.user.shell` in [your own module](/modules/custom).

## Choose a prompt

`prompt` names one of the catalog's prompts, or `none`. The prompt must run in the shell of your preset: Zsh with `terminal`, Bash with `minimal`. [Prompts](/config/prompts) shows each prompt, the presets it runs in and what `none` leaves you with.

## Choose an editor

| `editor`                 | What you get                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `astronvim`, the default | Neovim set up as AstroNvim: file explorer, fuzzy search, completion, Git UI, diagnostics and the language servers of your [toolchains](/config/toolchains). Neovim becomes the default `EDITOR`. |
| `neovim`                 | Plain Neovim. `vi` and `vim` start it too; `EDITOR` stays `nano`, and you configure language servers yourself.                                                                                   |
| `none`                   | No editor                                                                                                                                                                                        |

See [AstroNvim](/modules/astronvim) and [Neovim](/modules/neovim) for use and personal configuration.
Editors on the Mac, such as VS Code, work with any of these values; see
[Editors and IDEs](/vms/editors).

## Choose a multiplexer

`multiplexer = "tmux"` adds tmux: windows, split panes, mouse support, copying to the Mac clipboard and saved layouts that tmux restores after a restart. It also provides named sessions. From the Mac, `--session` opens a tmux session in the VM, or attaches to it when it exists:

::: code-group

```sh [Mac]
limanix shell dev-box --session work
```

:::

- Detach with Ctrl-B, then `d`, and run the same command to return.
- Session names cannot contain `.` or `:`.
- Without tmux or a session provider from your own module, `--session` names the setting that adds one and exits.

[Shell and sessions](/vms/shell) covers sessions, and [tmux](/modules/tmux#use) lists its keys.

## Your own startup files

Your startup files, such as `~/.zshrc`, load after the catalog's configuration: your settings override the catalog's. Keep them in your [dotfiles](/config/dotfiles) to share them between VMs.
