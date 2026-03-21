# Media Uploads

## Goal

Give hosts an easy way to add appealing photos, because image quality strongly affects discovery value and trust.

## MVP scope

- Multiple image uploads per listing
- Reorder, replace, and remove images
- Cover image support and basic image metadata
- Object storage integration with safe file validation

## Requirements

- Upload flows work on mobile and desktop.
- Images are constrained enough to protect storage costs and quality.
- Hosts understand upload limits by plan tier.

## Task breakdown

- Add signed upload flow from SvelteKit server routes to object storage.
- Validate file type, size, and image count server-side.
- Build upload UI with progress, retry, and remove actions.
- Support drag-and-drop or tap-to-upload ordering.
- Generate and persist cover image order in the database.
- Add cleanup logic for deleted or orphaned media objects.
- Expose plan-based limits in the upload experience.

## Acceptance criteria

- Hosts can upload, reorder, and delete listing photos.
- Public pages show images in the expected order.
- Invalid files are rejected with clear errors.

## Non-goals

- Video uploads
- Advanced AI image moderation in v1
