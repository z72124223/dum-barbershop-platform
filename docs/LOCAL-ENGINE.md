# DUM BARBERSHOP Platform — Local Engine Rules

## 1. Principle

The implementation engine runs from a local development environment. GitHub stores authoritative source, specifications, reviews, and release history; it is not the runtime engine.

## 2. Required local workflow

```bash
git clone https://github.com/z72124223/dum-barbershop-platform.git
cd dum-barbershop-platform
git checkout main
git pull --ff-only
```

For each task:

```bash
git checkout -b agent/<issue>-<slug>
# implement and validate locally
git add <explicit paths>
git commit -m "<scope>: <change>"
git push -u origin HEAD
```

Then open a draft pull request to `main`.

## 3. Local reproducibility

The repository must eventually provide:

- exact runtime and package manager requirements
- `.env.example`
- install command
- development command
- typecheck, lint, test, and production build commands
- migration and seed commands when a database is introduced

A new worker must be able to reproduce the environment from repository files without relying on hidden chat context.

## 4. Secrets

- Real credentials remain in local environment variables or approved secret storage.
- Never commit `.env`, API tokens, calendar credentials, customer exports, or payment secrets.
- Mock mode must remain available for local UI development.

## 5. Integration adapters

Local development must use adapters for external dependencies. Initial adapters may be mocks. Production providers are connected only after Owner approval and documented decisions.

## 6. Data safety

- Use fictional people and contact details in local fixtures.
- Do not clone production customer data into an ordinary development machine.
- If sanitized datasets are later allowed, document the procedure before use.

## 7. Validation

Before a PR is ready for review, run all checks declared in the repository. Until the application skeleton exists, the expected checks remain a TODO in `docs/DECISIONS.md`.
