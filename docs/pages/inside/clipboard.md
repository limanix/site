---
description: Copy to and paste from the Mac clipboard inside a VM with pbcopy and pbpaste.
---

# Clipboard

Inside the VM, `pbcopy` and `pbpaste` work like on your Mac: they copy to and paste from the Mac clipboard. Every VM has them. Your terminal on the Mac must allow it.

## Copy and paste

::: code-group

```sh [VM]
pbcopy < notes.txt
git diff | pbcopy
pbpaste > snippet.txt
```

:::

`pbcopy` copies its standard input to the Mac clipboard, and `pbpaste` prints the Mac clipboard. Neither takes options. They are other names of `lmx clipboard copy` and `lmx clipboard paste`.

## How they reach the Mac

There is no clipboard service between the Mac and the VM. `pbcopy` and `pbpaste` send OSC 52 escape sequences to the terminal you opened the shell in, and the terminal on your Mac writes or reads its clipboard. Inside tmux, they hand over to tmux, which passes the clipboard on through the terminal it is attached to.

That is why your terminal decides: it must support OSC 52 and allow it. `pbpaste` waits up to 10 seconds for its answer, and the terminal may first ask you for permission.

## Allow it in your terminal

| Terminal                                                         | Copy                                                                | Paste with `pbpaste`                                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Ghostty                                                          | Allowed by default: `clipboard-write = allow`                       | Asks each time by default; `clipboard-read = allow` stops asking                                                |
| kitty                                                            | Allowed by default: `write-clipboard` in `clipboard_control`        | Asks each time by default; `read-clipboard` in `clipboard_control` instead of `read-clipboard-ask` stops asking |
| [iTerm2](https://iterm2.com/3.4/documentation-escape-codes.html) | General › Selection › Applications in terminal may access clipboard | Supported since 3.5; requires permission                                                                        |
| WezTerm                                                          | Supported                                                           | Not supported: paste with Cmd+V                                                                                 |
| Alacritty                                                        | Allowed by default: `osc52 = "OnlyCopy"` in `[terminal]`            | Set `osc52 = "CopyPaste"`                                                                                       |

::: tip
When the terminal does not let the VM read the clipboard, paste with Cmd+V, the terminal's own paste shortcut.
:::

The tools of the catalog, such as the editor and tmux, copy through the same `pbcopy`; their pages in [the catalog](/modules/) show their keys. [Troubleshooting](/troubleshooting#clipboard-does-not-work) covers the messages of `pbcopy` and `pbpaste`.
