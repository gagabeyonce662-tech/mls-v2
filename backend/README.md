# Backend configuration

## Estate image uploads

EstateProperty featured and gallery uploads require Cloudinary. Set either
`CLOUDINARY_URL` or all of `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET`. `ESTATE_IMAGE_MAX_UPLOAD_MB` is optional and defaults
to `10`.

An uploaded featured image is returned as `featured_image_url`; imported legacy
URLs remain supported and are used when no uploaded asset exists.
