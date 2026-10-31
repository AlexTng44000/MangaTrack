# Dependency security maintenance

The frontend audit reported 13 entries on 2026-10-31, originating from two development dependencies:

- `zod` 4.6.5: [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). The npm lock now resolves 4.6.7, within the range accepted by `eslint-plugin-react-hooks`.
- `minimatch` 10.2.6: [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). The other moderate entries are dependent packages in the ESLint/TypeScript-ESLint toolchain affected by this same advisory.

ESLint and TypeScript-ESLint currently request minimatch 10, whereas the advisory requires at least 11.0.1. The frontend npm override and the workspace pnpm override therefore explicitly resolve minimatch 11.0.1. Remove these temporary overrides once the parent packages adopt a fixed version. Do not use `npm audit fix --force` to downgrade the lint toolchain.

The corrected npm tree was reinstalled using `npm ci`, then checked with frontend lint, TypeScript/Vite build, browser tests and backend type checking/tests. The lint run exercises the current configuration against the project's TypeScript and TSX files with minimatch 11. Both package-manager lockfiles include the correction. The pnpm lock update uses `--ignore-scripts` because the root postinstall starts Docker; it does not replace the npm installation used for application validation.

On Windows PowerShell, update an npm installation with:

```powershell
git pull origin main
cd frontend
npm.cmd ci
npm.cmd audit
cd ..
```

For a Docker-based application, rebuild from the repository root:

```powershell
docker compose up -d --build
```

For future audits, run `npm audit` separately in `frontend` and `backend`, or `pnpm audit` at the workspace root if using pnpm. Audit results depend on the advisory database at the time of the check; zero reported vulnerabilities is not a guarantee that no undiscovered issues exist.
