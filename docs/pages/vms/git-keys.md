---
description: Use a Git key from your Mac in a VM, set up with a module or by hand.
---

# Git and SSH keys

Git in a VM signs in to private repositories over SSH with a key. A VM has no
keys of its own, and LimaNix does not forward your Mac's SSH agent to it. Share
the key with the VM as a read-only folder, then point SSH in the VM to it, with
a module or by hand.

## Share the key

1. On the Mac, give the key a folder of its own: the VM then sees only this key.
   A hard link adds no second copy of it:

   ::: code-group

   ```sh [Mac]
   mkdir -m 700 ~/.ssh/limanix
   ln ~/.ssh/id_ed25519 ~/.ssh/limanix/id_ed25519
   ```

   :::

1. Share the folder read-only:

   ::: code-group

   ```toml [limanix.toml]
   [[mounts]]
   source = "~/.ssh/limanix"
   target = "/mnt/git-keys"
   mode   = "ro"
   ```

   :::

   Apply the change with `limanix update --config limanix.toml`. The key appears
   in the VM as `/mnt/git-keys/id_ed25519`; see
   [Shared folders](/config/mounts).

## Choose a way

SSH tries only its default key files, such as `~/.ssh/id_ed25519`. A setting
that names the server and the shared key tells it which key to offer:

| Way | Where the setting lives | It stays |
| -- | -- | -- |
| [A module](#with-a-module) | The VM's system, in `/etc/ssh/ssh_config` | In every VM that you create or update from `limanix.toml` |
| [By hand](#by-hand) | `~/.ssh/config` in your home in the VM | Through `stop`, `start` and `update`; a [recreated VM](/vms/storage#recreate-a-vm) gets a new, empty home |

## With a module

1. Write a module with an SSH setting for the server:

   ::: code-group

   ```nix [modules/git-keys/default.nix]
   { ... }:
   {
     programs.ssh.extraConfig = ''
       Host github.com
         IdentityFile /mnt/git-keys/id_ed25519
         IdentitiesOnly yes
     '';
   }
   ```

   :::

   `IdentitiesOnly yes` makes SSH offer only this key to the server. Add a
   `Host` block for each server. The module holds the key's path, not the key:
   keep private keys out of modules, as
   [Trust and secrets](/modules/custom#trust-and-secrets) explains.

1. Import the module on the Mac:

   ::: code-group

   ```sh [Mac]
   limanix modules add git-keys ./modules/git-keys
   ```

   :::

1. Select it next to the modules you already have, then apply the file with
   `limanix update --config limanix.toml`:

   ::: code-group

   ```toml [limanix.toml]
   [nixos]
   modules = ["third-party:git-keys"]
   ```

   :::

The setting goes to `/etc/ssh/ssh_config`. SSH reads `~/.ssh/config` first: a
setting of your own there takes precedence. To change the module later, import
it again; see
[Change an imported module](/modules/custom#change-an-imported-module).

## By hand

In the VM, add the same setting to `~/.ssh/config`:

::: code-group

```sh [VM]
mkdir -p -m 700 ~/.ssh
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile /mnt/git-keys/id_ed25519
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
```

:::

The file lives in your [managed home](/vms/storage#the-managed-home) on the Mac.
A VM created again from the same `limanix.toml` starts with a new, empty home:
add the setting there again, or use a module.

## Check the key

::: code-group

```sh [VM]
ssh -T git@github.com
```

:::

The first connection shows the server's host key and asks you to confirm it. SSH
saves it to `~/.ssh/known_hosts` and asks again in a new home. Then the server
greets you by your user name. `ssh -G github.com` prints the settings that SSH
uses for the server; its `identityfile` lines name the keys it offers.

## Who can read the key

A guest of your Mac's architecture shares folders with virtiofs, which shows
each file as owned by the account that reads it. Every account and program in
the VM can read the shared key, not only yours. Share only the keys that the VM
needs, and prefer a key that you can revoke on its own, such as a deploy key.

## If something fails

| Case | Next step |
| -- | -- |
| `Permission denied (publickey)` | Check that `ssh -G` with the server's name lists the shared key in `identityfile`, and that the server has its public key in your account. |
| `no such identity: /mnt/git-keys/…: No such file or directory` | The folder is not shared, or the file has another name. `lmx info` lists the shared folders; check `[[mounts]]` and run `limanix update`. |
| `Bad owner or permissions` on `~/.ssh/config` | Run `chmod 600 ~/.ssh/config` in the VM. |
| Git asks for a user name and password | The remote uses HTTPS. Switch it to SSH, such as `git remote set-url origin git@github.com:OWNER/REPO.git`. |
