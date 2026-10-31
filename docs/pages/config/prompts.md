---
description: Choose the prompt of your shell in the VM, and see each prompt of the catalog and the presets it runs in.
---

# Prompts

`prompt` in the `[shell]` table chooses the prompt of your shell in the VM. Every prompt of the catalog draws in the colors of your [theme](/config/themes) and, outside tmux, shows the [status words](/inside/lmx#status-words-in-tmux-and-the-prompt) of the VM.

::: code-group

```toml [limanix.toml]
[shell]
preset = "terminal"
prompt = "starship"
```

:::

Apply a change with `limanix update --config limanix.toml`; the next `limanix shell` starts with the new prompt.

## Choose a prompt

<PreviewGallery kind="prompts" />

Each preview shows the prompt in a Git repository with a changed file, after a command that succeeds and after one that fails, in the `catppuccin-mocha` theme.

## Where each prompt runs

A prompt must run in the shell of your preset: Zsh with `terminal`, Bash with `minimal`. `limanix create` and `limanix update` reject a prompt that does not and name the prompts that do.

<!-- @include: ../../.catalog/prompts.md -->

## Without a prompt

`pure` is the default with `terminal`, and `none` with `minimal`. `none` leaves the prompt to your startup files: set `PROMPT` in `~/.zshrc` or `PS1` in `~/.bashrc`. Until you do, Bash shows your account, the VM's hostname and the directory in the theme's colors.

## Your own settings

Each prompt reads your own settings from its own place, such as `~/.config/starship.toml` for [Starship](/modules/starship) or `~/.p10k.zsh` for [Powerlevel10k](/modules/powerlevel10k). The catalog page of each prompt names that place under Configuration and integration, and the settings that carry its colors under Colors.

A new prompt is added in the catalog; the [catalog guide](/contributing/catalog) describes how.
