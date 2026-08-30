# Security Remediation

## Purpose

This public document records the security work required to operate and maintain
this repository safely. It intentionally excludes production identifiers,
internal architecture details, deployment information, credentials, and
operational procedures that belong in private documentation.

## Security posture

This repository must not be treated as a boundary for protecting secrets or
proprietary implementation details. Public source, browser-delivered code,
network requests, and Git history are observable. Security therefore depends
on server-side enforcement, least-privilege credentials, protected deployment
configuration, and a maintained vulnerability-response process.

## Priority actions

### P0 — separate public and private material

- Keep only the public client, generic configuration examples, and
  contributor-facing documentation in this repository.
- Maintain server implementation, internal prompts and safety policies,
  detailed design documents, deployment configuration, and operational
  runbooks in a private repository.
- Copy and verify the private repository before removing any current material
  from the public repository.
- Replace detailed public documentation with product, contribution, and
  public-client setup guidance only.

### P0 — clean public history safely

- Inventory all paths that contain internal-only material across every branch
  and tag.
- Use a clean clone and `git-filter-repo` to remove those paths from all public
  refs, then review the rewritten history before any force-push.
- Coordinate re-clones with collaborators and assess forks and pull requests.
- Do not claim complete deletion: prior clones and forks can retain historical
  content. Never rewrite history before a maintainer approves the final
  force-push.

### P0 — prevent credential disclosure

- Ignore all `.env*` files and allow only `.env.example` templates to be
  committed.
- Keep every template value generic; never use working connection strings,
  tokens, or keys as examples.
- Enable GitHub secret scanning and push protection, and run a secret scanner
  locally and in CI before merge.
- If a credential is exposed, revoke or rotate it first. Removing a commit does
  not make the credential safe again.

## Application hardening requirements

- Validate every request at the API boundary, enforce small request-size and
  field-size limits, and rate-limit every write or expensive endpoint.
- Treat model output as untrusted. Validate component names, prop types,
  numeric ranges, text lengths, and array sizes before sending it to the
  browser. Reject unknown props.
- Emit security response headers and restrict CORS to explicit trusted origins.
- Use verified TLS for database and external-service connections. Any exception
  requires a documented provider requirement and a review date.
- Log only the minimum needed to diagnose failures. Never log request bodies,
  credentials, model prompts, or complete upstream error payloads.
- Record aggregate analytics only. Do not persist session identifiers,
  free-form user text, or model-derived interaction payloads.

## Engineering controls

- Add automated unit tests for validation, model-output filtering, privacy, and
  crisis/safety behavior before changing those paths.
- Run clean dependency installs, tests, production builds, and dependency
  audits on every pull request.
- Require reviewed pull requests and passing status checks before merge.
- Maintain a `SECURITY.md` policy and use private vulnerability reporting.
- Review dependencies and access permissions at least monthly and before every
  release.

## Implementation sequence

1. Enable repository security settings and protect the default branch.
2. Create and verify the private repository; migrate internal-only material.
3. Harden server-side validation, privacy controls, TLS, headers, logging, and
   rate limits with regression tests.
4. Remove private material from the public working tree and simplify public
   documentation.
5. Perform the reviewed Git-history rewrite and coordinate collaborators.
6. Verify the public repository contains no internal-only paths or secrets,
   then keep the automated controls enabled.

## Completion criteria

- Public history and the default branch contain no internal-only source,
  detailed system design, credentials, or deployment configuration.
- Environment-file rules reject all real environment files while retaining safe
  templates.
- All public checks pass on each pull request.
- Server tests prove input, model-output, analytics, and safety boundaries.
- A maintainer can receive vulnerability reports privately and has an
  up-to-date incident response procedure.
