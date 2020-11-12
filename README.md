# Hydra

![A query node builder for Substrate chains](./.gitbook/assets/hydra-logo-horizontallockup.svg)

A Substrate query node framework.
[TheGraph](http://thegraph.com/), it gives a smooth way to provide powerful GraphQL queries to app developers over your Substrate blockchain state and history.

## What's Hydra?

[Hydra](https://joystream.org/hydra) is a query node for Substrate-based blockchains. A query node ingests data from a substrate chain and provides rich, domain-specific, and highly customizable access to the blockchain data, far beyond the scope of direct RPC calls. For example, expired [Kusama Treasury](https://wiki.polkadot.network/docs/en/learn-treasury) spending [proposals](https://kusama.subscan.io/event?module=Treasury&event=Proposed) are pruned from the state of the [Kusama blockchain](https://polkascan.io/kusama), so querying, say, one-year-old proposals is problematic. Indeed, one has to track the evolution of the state by sequentially applying the Treasury events and extrinsics in each historical block.

That's where Hydra gets you covered. Define your data model and the Hydra indexer will get it in sync with the chain. On top of that, you get a batteries-included GraphQL server with comprehensive filtering, pagination, and even full-text search capabilities.

## Monorepo structure

The monorepo contains the following sub-packages:

* [Hydra CLI](./packages/hydra-cli/README.md): set up and run a Hydra pipeline
* [Hydra Indexer](./packages/hydra-indexer/README.md): Hydra indexer for ingesting raw events and extrinsics
* [Hydra Indexer Gateway](./packages/hydra-indexer-gateway/README.md): GraphQL interface for the Indexer
* [Hydra Processor](./packages/hydra-indexer-gateway/README.md): Downstream part of the pipeline for transforming events into reach business-level objects
* [Docs](./docs/README.md): In-depth documentation covering the whole pipeline and features, such as full-text search, pagination, extensive filtering and a rich GraphQL dialect defining your schema!
