# angle-merkl-redeemer

Create `.env` in root with

```bash
RPC_URL=<rpc URL or tenderly fork rpc for test>
PRIVATE_KEY=<private key>
```

To install bun (requires version 1.0.0 due to axios problems):

```bash
curl -fsSl https://bun.sh/install | bash -s "bun-v1.0.0"
```

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.4. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
