[![limanix.dev](https://img.shields.io/website?url=https%3A%2F%2Flimanix.dev&label=limanix.dev&up_message=online)](https://limanix.dev)
[![docs.limanix.dev](https://img.shields.io/website?url=https%3A%2F%2Fdocs.limanix.dev&label=docs.limanix.dev&up_message=online)](https://docs.limanix.dev)
[![License: Apache-2.0](https://img.shields.io/github/license/limanix/site?label=license)](LICENSE)

<p align="center">
  <img src=".github/assets/readme-header.png"
       alt="LimaNix"
       width="100%">
</p>

The website and documentation of [LimaNix](https://github.com/limanix/client):
NixOS development machines on your Mac, declared in one file.

[Website](https://limanix.dev) |
[Docs](https://docs.limanix.dev) |
[Client](https://github.com/limanix/client) |
[Modules](https://github.com/limanix/modules) |
[lmx](https://github.com/limanix/lmx)

## Contributing

Catalog pages come from the READMEs in [`modules/catalog`](https://github.com/limanix/modules/tree/main/catalog).
Edit module descriptions there; this repository owns the general guides and navigation.
The catalog map on the landing page comes from `catalog/graph.json` in the same repository.

The docs build reads the latest published modules release once, then uses that tag for every module page.
It prints the tag and shows it on the pages.
Run `task ci/node/build APP=docs` to build, or `task run/docs` to preview.
A new modules release is picked up on the next site build; it does not publish the site by itself.

For a specific release or unpublished README edits, run from `docs/` with Node.js 22 and npm:

```sh
npm ci
MODULES_REF=v7 npm run build
MODULES_ROOT=../../modules npm run dev
```

`MODULES_ROOT` takes precedence over `MODULES_REF` and marks pages as a local preview.
Restart the preview after changing a module README.
The build uses Node.js and `tar`; downloaded catalog data stays in the ignored `docs/.catalog/` directory.
`npm test` checks the page links, including imported READMEs, and the catalog loader's key behavior.

Follow the
[contribution guide](https://github.com/limanix/.github/blob/main/CONTRIBUTING.md).
