# Documentation scripts

Run from `docs/`:

| Entrypoint                            | Purpose                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| `node scripts/prepare.mjs`            | Generate the catalog, previews and reference fragments.                         |
| `node scripts/check-pages.mjs pages`  | Check internal links, anchors and include files/regions. Run preparation first. |
| `node --test scripts/test/*.test.mjs` | Run unit tests without downloads.                                               |

`npm run dev`, `npm run build` and `npm test` prepare sources automatically.
Build and test also check pages. External URLs are not requested by the checker.

## Layout

- `lib/catalog/`: read modules, render pages and write catalog/preview files.
- `lib/reference/`: render client/lmx JSON into Markdown fragments.
- `lib/pages/`: expand includes, collect anchors and check internal links.
- `lib/sources.mjs`: local/GitHub reads and latest-release lookup.
- `lib/paths.mjs`, `lib/artifacts.mjs`: generated paths and catalog reader.
- `test/`: behavior tests. `lib/` modules do not run generation on import.

Generated files: `.catalog/`, `.reference/`, `pages/public/{themes,prompts}/`.

## Sources

| Repository        | Default                      | Local checkout override |
| ----------------- | ---------------------------- | ----------------------- |
| `limanix/modules` | Latest release               | `MODULES_ROOT`          |
| `limanix/client`  | Latest release               | `CLIENT_ROOT`           |
| `limanix/lmx`     | Version pinned by the client | `LMX_ROOT`              |
| `limanix/.github` | `main`                       | `ORG_ROOT`              |

Check against sibling checkouts:

```sh
MODULES_ROOT=../../modules CLIENT_ROOT=../../client \
LMX_ROOT=../../lmx ORG_ROOT=../../.github npm test
```

Use the same overrides with `npm run build`. Run `npm run lint` for formatting.
