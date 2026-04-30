# Security Policy

## Supported Versions

PrePro Studio is currently in public beta. Security fixes are applied to the latest version on `main`.

## Reporting a Vulnerability

If you find a security issue, please report it privately through GitHub's vulnerability reporting flow when enabled.

If private reporting is not available, open a GitHub issue with a minimal description and avoid posting secrets, exploit details, personal data, or production credentials publicly. We will follow up privately if more detail is needed.

## Data Handling

PrePro Studio stores project data in the browser's local storage by default. Shared links may encode project schedule data into the URL hash, so only share generated links with people who should see that production information.

Never commit `.env`, `.env.local`, API keys, AdSense IDs, OAuth secrets, or deployment tokens to this repository.
