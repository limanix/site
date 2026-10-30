---
description: Zsh, the prompt, AstroNvim, tmux and the other tools of the terminal preset, and how to start each one.
---

# The terminal

The `terminal` shell preset, the default, sets up the VM for development in the terminal. This page shows what each of its tools is for and how to start it. To switch a tool off or choose another prompt or editor, see [Shell](/config/shell).

## What you get

| Tool               | Use it for                                                     | Start it with                      |
| ------------------ | -------------------------------------------------------------- | ---------------------------------- |
| Zsh with Oh My Zsh | Your shell, with completion, suggestions and history search    | `limanix shell dev-box` on the Mac |
| Pure prompt        | Directory, Git state and how long a command took               | Every shell                        |
| CLI tools          | Searching, reading files, querying data, sending HTTP requests | `rg`, `fd`, `bat`, `jq` and more   |
| Lazygit            | Git in a terminal interface                                    | `lazygit`                          |
| Yazi               | Browsing files                                                 | `y`                                |
| GitHub CLI         | Working with GitHub from the terminal                          | `gh`                               |
| AstroNvim          | Editing code, with language servers                            | `nvim`                             |
| tmux               | Windows, panes and sessions that outlive a closed terminal     | `tmux`                             |

The `minimal` preset has Bash, Git and the CLI tools, plus an editor or tmux when you choose them.

## Welcome and help

Each new shell session starts with the welcome: the state of the VM, its resources, network, shared folders and selected modules. When something needs attention, the welcome names it, with the command that helps. Run `lmx welcome` to show it again; [The lmx command](/inside/lmx#the-welcome) explains what it shows.

`lmx help` shows the commands of the VM and the help topics. `lmx help TOPIC`, such as `lmx help tmux`, shows what a tool gives you: its commands, common tasks and a link to its guide. The terminal tools have the topics `zsh`, `cli-tools`, `lazygit`, `yazi`, `astronvim` and `tmux`.

## Zsh and the prompt

The [Zsh guide](/modules/zsh) covers completion, history, directory navigation and project environments.
It also covers personal startup files; [Prompts](/config/prompts) shows the prompts you can choose.

## CLI tools

The [CLI tools guide](/modules/cli-tools) lists the commands included in both presets, with examples for file search and Git diffs.

## Git and Lazygit

Set your Git identity inside the VM as described in [CLI tools](/modules/cli-tools#git).
See [Lazygit](/modules/lazygit#use) for its terminal interface and configuration.
The GitHub CLI, `gh`, is also part of the terminal preset.

## Yazi

See [Yazi](/modules/yazi#use) to browse files, preview them and return to the chosen directory in your shell.

## AstroNvim

See [AstroNvim](/modules/astronvim) for editing, navigation, language servers and personal configuration.
The [session guide](/modules/astronvim#save-and-resume-a-project) explains what a saved editor session restores.

## tmux

See [tmux](/modules/tmux#use) for windows, panes, keys and saved layouts.
[Shell and sessions](/vms/shell) explains how to open a named session from the Mac.

## A typical workflow

Open a session from the Mac:

::: code-group

```sh [Mac]
limanix shell dev-box --session work
```

:::

In the VM, run `cd /workspace` and `nvim .` to open the project in the editor. Press Ctrl-B, `c` for a new window and run `lazygit` there to review your changes. Open one more window for the project's build and test commands. Switch windows with Ctrl-B, `n` and Ctrl-B, `p`. Detach with Ctrl-B, `d`, and run the same `limanix shell` command to return.

## Set up the terminal on your Mac

Fonts, colors and the clipboard belong to the terminal on your Mac, not to the VM:

- Choose a Nerd Font and turn on true color. `limanix shell` passes the terminal's `COLORTERM` to the VM when it is `truecolor` or `24bit`; the VM's tools then draw a theme's exact colors.
- Allow OSC 52 clipboard access; see [Clipboard](/inside/clipboard).
- Send Option as Alt, for Alt keys such as Alt-H/J/K/L.

The VM knows Ghostty's terminal type, `xterm-ghostty`. By default, the tools draw in the colors and on the background of your terminal's theme; [Themes](/config/themes) has the other choices.
