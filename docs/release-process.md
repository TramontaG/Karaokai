# Release process

KaraokAI stable releases are created from annotated source tags matching
`vX.Y.Z`, such as `v1.0.0`. The release workflow builds artifacts on
GitHub-hosted Windows and Ubuntu runners and:

1. installs dependencies from `package-lock.json` with `npm ci`;
2. runs automated tests and the TypeScript/Vite build;
3. packages the x64 Windows NSIS installer, Linux x64 AppImage, and Linux x64
   Debian package;
4. retains the unsigned Windows installer as a GitHub Actions artifact;
5. generates one `checksums.txt` file with the SHA-256 hash of every release
   asset; and
6. creates or updates a release containing all platform assets and the
   checksum file.

Every artifact name includes the package version. The tag and `package.json`
version must match, except that the tag has the leading `v`.

The workflow invokes `electron-builder` with `--publish never` explicitly.
This applies even when publishing an existing tag whose historical
`package.json` predates the release workflow. `electron-builder` only creates
the installer; the workflow publishes release assets explicitly with the GitHub
CLI after checksums have been generated. This prevents CI auto-detection from
making `electron-builder` attempt to publish with a separate GitHub token.
The publication job sets `GH_REPO` explicitly because it only downloads build
artifacts and does not check out a Git repository.

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
