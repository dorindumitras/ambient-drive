# Build and verify Ambient Drive

This source snapshot corresponds to app **0.2.6** and service **0.2.5**. It contains the application code, service, runtime kit, font resources and license notices, build scripts and product regression tests. No BMW SDK, native binary or original vehicle artwork is included.

## Desktop requirements

- Node.js 18 or newer, available as `node`.
- Python 3.10 or newer, available as `python3`.
- macOS, Linux or a Linux environment in WSL. The regression suite uses Unix sockets and `/tmp`.

The build uses the Node and Python standard libraries; there is no npm/pip dependency installation. Desktop tools build the package; the installed app targets the MGU's Node 8 runtime. The vehicle supplies its own native SOME/IP module and MGU Store supplies the donor SDK when installing.

## Clean build

Run from the repository root:

```sh
python3 tools/build-release.py --validation
```

Outputs:

```text
validation/USB/mgu-repo/ambient-drive-test/
  catalog.json
  ambient-drive.png
  dorin-ambient@0.2.5.tgz
  dorin_ambientdrive@0.2.6.tgz
```

The generated local catalog uses relative URLs for USB installation. The public catalog uses absolute GitHub release URLs. The artifact bytes and their checksums are the same for this audited source snapshot.

The `--validation` flag is intentional: vehicle retesting and full sleep/wake validation remain pending in the recorded test status. The build does not clear that status or claim validation on other models.

## Tests and reproducibility

After building:

```sh
python3 tools/test.py
```

This runs 12 JavaScript regression suites and checks the native UI, package contents and published artifact hashes. The tests exercise local fakes, temporary files and Unix sockets. They do not load BMW binaries or contact a car. `tools/verify-published.py` compares against the versioned checksums in `RELEASE-ARTIFACTS.json` without downloading anything.

The source audit rebuilt both published packages byte for byte on the recorded audit host. That result is evidence for this snapshot; physical vehicle operation remains a separate check. When deliberately changing product code, increment the relevant component version and record the new artifact hashes rather than replacing bytes under an existing version.

## Source map

- `apps/dorin_ambientdrive/`: native HMI app, previews and color indicators.
- `native/dorin-ambient/`: root service, rule model, persistence, vehicle adapter and service unit.
- `kit/`: MIT application kit with its retained notices and font license.
- `tools/`: build, test and verification entry points.
- `tests/`: product tests and bounded fixtures, with no original BMW image pack.

See [INSTALL.md](INSTALL.md) for using published packages and [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) for the current vehicle scope.

## Prepare complete deliverables

After building and passing the tests:

```sh
python3 tools/prepare-publication.py
```

This writes `publication/Ambient-Drive-0.2.6-Stick.zip` and `publication/Ambient-Drive-0.2.6-GitHub-Complet.zip`. The latter includes the full repository, named source ZIP, both prebuilt packages, approved icon, absolute-URL catalog, source inventory and checksums. No network request or GitHub mutation occurs. See [docs/PUBLISHING-RO.md](docs/PUBLISHING-RO.md).

The optional integration check uses the official MGU Store `sources.js`, `catalog.js` and `tar.js` modules, obtained separately from the pinned revision recorded in [docs/PUBLICATION-AUDIT.md](docs/PUBLICATION-AUDIT.md):

```sh
node tools/check-store-reader.js /absolute/path/to/pinned-official-reader
```

It tests fresh installation and upgrade listing, anonymous GitHub/HTTPS resolution, USB files, metadata, dependencies, hashes and archive parsing. Its HTTP adapter serves the candidate files at their intended URLs locally. It does not claim that unpublished assets are already downloadable or install anything on a vehicle. Generated `publication/` is excluded from source snapshots.
