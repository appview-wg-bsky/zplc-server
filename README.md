# zplc

integer representation of did:plc identifiers.
it's basically just the order that they appear in the plc.directory export

## usage

```shell
$ # ingest from plc.directory exports:
$ deno task ingest
# -- [parallel session] --
$ # serve the zplc api:
$ deno task serve
```
