# Release process

KaraokAI release candidates are created from annotated source tags matching
`v*-rc.*`. The release workflow runs on a GitHub-hosted Windows runner and:

1. installs dependencies from `package-lock.json` with `npm ci`;
2. runs formatting checks, automated tests, and the TypeScript/Vite build;
3. packages the x64 NSIS installer with `npm run build:windows`;
4. generates `checksums.txt` with the SHA-256 hash of the installer;
5. retains the unsigned installer as a GitHub Actions artifact; and
6. creates a prerelease containing the installer and checksum file.

The installer name includes the package version. The tag and `package.json`
version must match, except that the tag has the leading `v`.

The workflow invokes `electron-builder` with `--publish never` explicitly.
This applies even when publishing an existing tag whose historical
`package.json` predates the release workflow. `electron-builder` only creates
the installer; the workflow publishes release assets explicitly with the GitHub
CLI after checksums have been generated. This prevents CI auto-detection from
making `electron-builder` attempt to publish with a separate GitHub token.

## Current signing status

Windows releases are unsigned until SignPath Foundation accepts KaraokAI and
provides its organization ID, project slug, signing-policy slug, and API-token
configuration. The release notes state this status clearly.

## Enabling SignPath after approval

Before enabling signing, install the SignPath GitHub App for this repository,
link the GitHub trusted build system and the KaraokAI SignPath project, and add
the API token as the `SIGNPATH_API_TOKEN` GitHub Actions secret.

Then update `.github/workflows/release.yml` after the `upload-unsigned-artifact`
step to use the project values supplied by SignPath:

```yaml
- name: Submit signing request
  uses: signpath/github-action-submit-signing-request@v2
  with:
    api-token: ${{ secrets.SIGNPATH_API_TOKEN }}
    organization-id: <SignPath organization ID>
    project-slug: <SignPath project slug>
    signing-policy-slug: <SignPath signing policy slug>
    github-artifact-id: ${{ steps.upload-unsigned-artifact.outputs.artifact-id }}
    wait-for-completion: true
    output-artifact-directory: signed-release
```

The release upload step must then publish the installer from `signed-release`,
not the unsigned file from `release`. Every signing request requires the
approver's manual approval in SignPath. Do not add placeholders, tokens, or
project identifiers to the repository.

## Repository controls

The maintainer must use multi-factor authentication for GitHub and SignPath.
On GitHub, protect the default branch against force pushes and require reviews
for pull requests from non-committers. Restrict the ability to create release
tags and to modify GitHub Actions workflows to trusted maintainers.
