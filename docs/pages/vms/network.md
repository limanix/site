---
description: Reach services in a VM from the Mac, open firewall ports and check a connection.
---

# Network

Each VM has its own IP address on a private network between your Mac and its VMs. You reach a
service in a VM at that address: LimaNix forwards no ports to the Mac's `localhost`.

## The shared network

`[network] mode` has one value, `shared`, which is the default: a NAT network on which the VM
reaches the internet through the Mac, and the Mac reaches the VM at its own address. Other computers
on your network do not reach the VM.

| Guest                   | Network                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| Your Mac's architecture | The native NAT of Apple Virtualization                                                                       |
| The other architecture  | Lima's shared network, which `limanix network setup` prepares; see [Set up QEMU](/vms/resources#set-up-qemu) |

Without port forwarding, `localhost:8080` on the Mac is not the VM's port `8080`. In return, two VMs
can serve the same port, and a service in a VM never takes a port on the Mac. Only SSH goes through
a port on the Mac's `127.0.0.1`; see [SSH ports](/reference/paths#ssh-ports).

## Find the address

::: code-group

```sh [Mac]
limanix list
```

:::

The `ADDRESS` column shows the VM's IPv4 address on the shared network. The VM reports it while it
runs; it is not a static address. Check it again when you reconnect. A `-` means the VM is stopped,
did not answer within 10 seconds, or has no address on the shared network. Inside the VM,
`lmx status` shows the addresses on its `Network` line.

## Reach a service

A connection from the Mac needs three parts:

| Part           | Where to set it                                  | What it needs                                                    |
| -------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| Listener       | The service's settings or startup arguments      | Listen on `0.0.0.0` or the guest's address, on the intended port |
| Guest firewall | `[network.ports]` in `limanix.toml`              | Open the port for the service's protocol                         |
| Access rules   | The service's own authentication and permissions | Allow your client and the credentials it uses                    |

A service bound to `127.0.0.1` accepts connections from inside the VM only. Listening on `0.0.0.0`
means all IPv4 interfaces of the guest; it does not limit access to the Mac. When a service has
rules for client addresses, use the Mac's address as that service sees it, not the guest's
`ADDRESS`.

For an HTTP service on port 8080, open `http://ADDRESS:8080` on the Mac, with the `ADDRESS` from
`limanix list`. [PostgreSQL](/modules/postgres) shows the listener and access rules of a database.

## Open ports

::: code-group

```toml [limanix.toml]
[network.ports]
tcp = [8080]
```

:::

`tcp` and `udp` list the inbound ports that the guest firewall opens, as whole numbers from `1` to
`65535`. Keep the ports you already have and add new ones to the same lists. Apply a change with
`limanix update --config limanix.toml`; the update restarts the VM. Afterwards, start again any
service that you run by hand. A list you leave out opens no ports.

The lists only open the guest firewall:

- they do not start services, map Mac ports to guest ports or restrict who connects;
- the base system and modules can open ports of their own, even with empty lists: TCP 22 is always
  open for SSH;
- Docker opens the ports it publishes with its own rules, and removing a port from
  `[network.ports]` does not close them; see [Docker](/modules/docker).

## Try a connection

Test the path with a small web server before you set up your own service:

1. Open port 8080 and apply the file with `limanix update --config limanix.toml`. Add the port to
   the `tcp` list you already have rather than a second copy of the table:

   ::: code-group

   ```toml [limanix.toml]
   [network.ports]
   tcp = [8080]
   ```

   :::

2. In the VM, serve a page on all addresses. `nix shell` fetches Python for this one command:

   ::: code-group

   ```sh [VM]
   mkdir -p /tmp/demo && cd /tmp/demo
   printf 'Hello from LimaNix\n' > index.html
   nix shell nixpkgs#python3 --command \
     python3 -m http.server --bind 0.0.0.0 8080
   ```

   :::

3. On the Mac, open `http://ADDRESS:8080/` with the `ADDRESS` from `limanix list`. The page shows
   `Hello from LimaNix`. Press Ctrl-C in the VM to stop the server.

## Check a port

::: code-group

```sh [Mac]
limanix network check dev-box 8080
```

:::

The command runs these checks in order and prints a hint under a check that needs attention:

| Check      | What it checks                                                  |
| ---------- | --------------------------------------------------------------- |
| `vm`       | The VM runs, and its last create or update completed            |
| `address`  | The guest has an IPv4 address on the shared network             |
| `firewall` | The guest firewall opens the port for its protocol              |
| `listener` | Something listens on the port on an address other than loopback |
| `process`  | Which process and user hold the socket, when something listens  |
| `connect`  | The Mac connects to the address and port within 3 seconds       |

Add `--udp` for a UDP port; it has no `connect` check, because UDP has no connection to try.
`--json` prints the same checks for scripts. The command exits with status 1 when a check failed.

| Result                                          | Next step                                                                                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A check in the VM fails                         | Follow the hint under it.                                                                                                                                                |
| Only `connect` fails                            | The checks do not locate the failure. Check a VPN, a firewall on the Mac, and the Local Network permission of your terminal app in System Settings › Privacy & Security. |
| Every check passes, and your client still fails | Check the service's access rules and your credentials. Opening another port does not fix an access denial.                                                               |

### Check from inside the VM

`lmx net check` runs the guest's part of these checks: `firewall`, `listener` and `process`.

::: code-group

```console [VM]
$ lmx net check 8080
ok      firewall    TCP 8080 is open in the guest firewall.
failed  listener    TCP 8080 listens on 127.0.0.1 only and is reachable only inside the guest.
                    Make the application listen on 0.0.0.0 or the guest address.
ok      process     node (pid 812) holds the socket of user dev.
```

:::

Add `--udp` for a UDP port. When Docker's proxy holds the socket, the check warns: Docker, not
`[network.ports]`, controls the ports it publishes.
