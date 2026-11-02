[![limanix.dev](https://img.shields.io/website?url=https%3A%2F%2Flimanix.dev&label=limanix.dev&up_message=online)](https://limanix.dev)
[![docs.limanix.dev](https://img.shields.io/website?url=https%3A%2F%2Fdocs.limanix.dev&label=docs.limanix.dev&up_message=online)](https://docs.limanix.dev)
[![License: Apache-2.0](https://img.shields.io/github/license/limanix/site?label=license)](LICENSE)

<div align="center">
<p align="center">
  <img src=".github/assets/readme-header.png"
       alt="LimaNix"
       width="100%">
</p>

<p align="center">
<a href="https://docs.limanix.dev/quick-start"><code>→ Get started</code></a>&nbsp;
<a href="https://docs.limanix.dev/"><code>Documentation</code></a>
</p>
<p align="center"><sub>macOS 26 or newer | Apple Silicon and Intel</sub></p>
</div>

## Development

You need [Task](https://taskfile.dev) 3.53.1 or newer and Docker; every task runs in a container.

| Task | Does |
| -- | -- |
| `task run/docs`, `task run/app` | Previews the docs at http://localhost:5174 or the landing page at http://localhost:5173 |
| `task ci/node/build APP=docs` | Lints and builds the docs into `docs/dist`, or the landing page into `app/dist` with `APP=app` |
| `task ci/node/test APP=docs` | Runs the tests; for the docs they also check the links, code blocks and style of the pages |
| `task ci/node/audit APP=docs` | Audits the npm dependencies |
| `task ci/terraform/fmt`, `task ci/terraform/validate` | Check the hosting in `tf/` |

The build reads module pages, the catalog graph, references and the contribution guide from the other repositories.
The [contribution guide](https://github.com/limanix/.github/blob/main/CONTRIBUTING.md#what-the-site-reads) lists what comes from where, and the build prints the releases it read.
A release elsewhere reaches the site with the next tag `v<version>` on `main`; it does not publish the site by itself.

To build from other sources, run from `docs/` with Node.js 22 and npm:

```sh
npm ci
MODULES_REF=v12 CLIENT_REF=v0.3.1 npm run build
MODULES_ROOT=../../modules CLIENT_ROOT=../../client LMX_ROOT=../../lmx ORG_ROOT=../../.github npm run dev
```

`MODULES_REF` and `CLIENT_REF` select a release instead of the latest one; an older client fails the build when the pages use a command it lacks.
`MODULES_ROOT`, `CLIENT_ROOT`, `LMX_ROOT` and `ORG_ROOT` read a local checkout and take precedence.
Restart the preview after changing a source.
The build uses Node.js and `tar`; downloaded data stays in the ignored `docs/.catalog/` and `docs/.reference/` directories.

## Contributing

Follow the [contribution guide](https://github.com/limanix/.github/blob/main/CONTRIBUTING.md).
