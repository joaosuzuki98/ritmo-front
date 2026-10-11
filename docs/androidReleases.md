# Android releases

## Automatic release builds

Merging a Release Please release PR into `main` creates a GitHub release and calls
`.github/workflows/build-apk.yml` directly. This works with `GITHUB_TOKEN`, whose
release events do not trigger a separate `release: published` workflow.

The APK workflow checks out the release tag and verifies its commit against the
Release Please SHA. It runs Jest and ESLint, builds a signed release APK (including
the JavaScript bundle), and verifies the APK's version, application ID and signing
certificate before uploading it.

The APK is attached to the same GitHub release as `ritmo-<version>.apk`. A copy is
also available in Actions artifacts for 14 days. The release itself is created
before the build: check the APK job status if a release has no APK attachment.

## Versioning

Release Please is the source of the published APK version. For tag `v1.0.2`:

-   `versionName` is `1.0.2`.
-   `versionCode` is `1000002`, using `major * 1000000 + minor * 1000 + patch`.

Only stable `vMAJOR.MINOR.PATCH` tags are supported. Minor and patch must each be
below 1000, and the computed code must be between 1 and 2100000000. Publish newer
versions in increasing semantic-version order. Rebuilding the same release keeps
the same version code; use a new release for a new app update.

Gradle receives `appVersionName` and `appVersionCode` as build properties. These
override the local defaults without modifying source files or `package.json`.
The `simple` Release Please strategy remains responsible for release versioning.

## Signing

Configure these repository Actions secrets:

| Secret                      | Value                           |
| --------------------------- | ------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | Base64-encoded release keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password               |
| `ANDROID_KEY_ALIAS`         | Release key alias               |
| `ANDROID_KEY_PASSWORD`      | Release key password            |

The runner restores the keystore into its temporary directory and removes it
after verification, including on failure. Gradle uses the `ANDROID_KEYSTORE_PATH`
environment variable and the three signing credential variables. Release builds
fail without those credentials; debug builds continue to use the debug keystore.

Keep the same release key and `applicationId` for compatible updates. An existing
debug-signed installation cannot be updated with this release key. Keep a secure
backup of the keystore and credentials outside GitHub.

## Manual rebuilds and retries

Once the workflow is available on the default branch, open **Actions → Build
release APK → Run workflow**, select `main`, and supply an existing release tag.
Only published, stable releases are accepted. The workflow always checks out the
tag, rather than building the current tip of `main`.

A successful rebuild replaces the APK attachment with the same filename. If an
automatic APK build fails, use this manual workflow to retry that tag; rerunning
Release Please may not output `release_created` again for an existing release.

The selected tag must already contain the Gradle signing/version configuration
introduced with this workflow. The existing `v1.0.1` predates it, so use a new
release containing these changes for the first automated APK. Do not move an old
tag to a different commit to retrofit build support.
