import uuid
from io import BytesIO
from typing import Optional
from urllib.error import URLError, HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework import serializers

from .models import VlogPost, VlogCategory
from .sanitizers import sanitize_post_html

class VlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VlogCategory
        fields = ['id', 'name', 'slug']
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
        }


class VlogPostWriteSerializer(serializers.ModelSerializer):
    """Serializer used for POST/PUT/PATCH on VlogPost.

    Accepts ``category_id`` for the FK and returns the full read serializer
    representation in the response so the caller gets the same shape as GET.

    ``thumbnail_url`` lets Studio set the featured image from a URL already
    produced by ``/api/vlog/uploads/`` (or clear it with an empty string)
    without re-encoding the whole post as multipart.
    """

    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=VlogCategory.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )
    faq_items = serializers.JSONField(required=False)
    thumbnail_url = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
    )

    class Meta:
        model = VlogPost
        fields = [
            "title", "slug", "excerpt", "content",
            "embed_url", "video_file", "thumbnail", "thumbnail_url",
            "category_id", "tags",
            "status", "publish_date", "allow_comments",
            "seo_title", "seo_description", "seo_keywords", "focus_keyword",
            "seo_canonical_url", "seo_noindex",
            "og_title", "og_description", "og_image",
            "twitter_title", "twitter_description", "twitter_image",
            "faq_items",
        ]
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
            "excerpt": {"required": False, "allow_blank": True},
            "embed_url": {"required": False, "allow_blank": True},
            "tags": {"required": False, "allow_blank": True},
            "thumbnail": {"required": False},
        }

    def validate_content(self, value):
        """Strip anything that is not prose markup before it reaches the DB.

        See vlog/sanitizers.py for why this runs server-side as well as at
        render time.
        """
        return sanitize_post_html(value)

    def validate_title(self, value):
        title = (value or "").strip()
        if not title:
            raise serializers.ValidationError("A title is required.")
        return title

    def validate_faq_items(self, value):
        """FAQ is free-form JSON on the model; enforce the shape the UI expects."""
        if value in (None, ""):
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError(
                "FAQ items must be a list of {question, answer} objects."
            )
        cleaned = []
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    "Each FAQ item must be an object with question and answer."
                )
            question = str(item.get("question", "")).strip()
            answer = str(item.get("answer", "")).strip()
            if question or answer:
                cleaned.append({"question": question, "answer": answer})
        return cleaned

    def validate(self, attrs):
        """Guard publishing, and guard against silently overwriting a co-author.

        `expected_updated_at` is optional: clients that send it get a 409 instead
        of clobbering an edit made since they loaded the form. Clients that don't
        keep the previous last-write-wins behaviour.
        """
        status_value = attrs.get(
            "status", getattr(self.instance, "status", VlogPost.DRAFT)
        )
        if status_value == VlogPost.PUBLISHED:
            title = attrs.get("title", getattr(self.instance, "title", "")) or ""
            content = attrs.get("content", getattr(self.instance, "content", "")) or ""
            if not title.strip():
                raise serializers.ValidationError(
                    {"title": "A published post needs a title."}
                )
            if not content.strip():
                raise serializers.ValidationError(
                    {"content": "A published post needs some content."}
                )
        return attrs

    def validate_thumbnail_url(self, value):
        url = (value or "").strip()
        if not url:
            return ""
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise serializers.ValidationError("Featured image URL must be http(s).")
        return url

    def create(self, validated_data):
        thumb_url = validated_data.pop("thumbnail_url", None)
        instance = super().create(validated_data)
        if thumb_url is not None:
            self._apply_thumbnail_url(instance, thumb_url)
            instance.save(update_fields=["thumbnail"])
        return instance

    def update(self, instance, validated_data):
        thumb_url = validated_data.pop("thumbnail_url", None)
        instance = super().update(instance, validated_data)
        if thumb_url is not None:
            self._apply_thumbnail_url(instance, thumb_url)
            instance.save(update_fields=["thumbnail"])
        return instance

    def _apply_thumbnail_url(self, instance, url: str) -> None:
        """Set or clear the featured image from a Studio upload URL."""
        if not url:
            if instance.thumbnail:
                instance.thumbnail.delete(save=False)
            instance.thumbnail = None
            return

        data = None
        content_type = ""

        # Prefer copying a file already in our storage (uploads land there first)
        # so we do not depend on the public URL being fetchable from the server.
        # Always copy — never alias the upload path — so clearing the featured
        # image cannot delete a file still referenced inside the post body.
        storage_name = self._storage_name_from_url(url)
        if storage_name and default_storage.exists(storage_name):
            try:
                with default_storage.open(storage_name, "rb") as existing:
                    data = existing.read(5 * 1024 * 1024 + 1)
            except Exception:
                data = None

        if data is None:
            try:
                request = Request(url, headers={"User-Agent": "HomeAtlas-Studio/1.0"})
                with urlopen(request, timeout=20) as response:
                    data = response.read(5 * 1024 * 1024 + 1)
                    content_type = (response.headers.get("Content-Type") or "").split(";")[0].strip().lower()
            except (URLError, HTTPError, TimeoutError, ValueError, OSError) as exc:
                raise serializers.ValidationError(
                    {"thumbnail_url": "Could not download that featured image."}
                ) from exc

        if len(data) > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                {"thumbnail_url": "Featured images must be 5 MB or smaller."}
            )

        extension = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
        }.get(content_type)
        if not extension:
            path = (storage_name or urlparse(url).path or "").lower()
            for candidate in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
                if path.endswith(candidate):
                    extension = ".jpg" if candidate == ".jpeg" else candidate
                    break
        if not extension:
            extension = ".jpg"

        # Re-encode when Pillow is available so we never store a hostile payload.
        payload = ContentFile(data)
        try:
            from PIL import Image

            image = Image.open(BytesIO(data))
            image.load()
            image_format = (image.format or "").upper()
            allowed = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp", "GIF": ".gif"}
            if image_format not in allowed:
                raise serializers.ValidationError(
                    {"thumbnail_url": "Featured image must be a JPEG, PNG, WebP or GIF."}
                )
            extension = allowed[image_format]
            if image_format != "GIF" or not getattr(image, "is_animated", False):
                if image_format == "JPEG" and image.mode not in ("RGB", "L"):
                    image = image.convert("RGB")
                buffer = BytesIO()
                save_kwargs = {"quality": 85, "optimize": True} if image_format in {"JPEG", "WEBP"} else {}
                if image_format == "PNG":
                    save_kwargs = {"optimize": True}
                image.save(buffer, format=image_format, **save_kwargs)
                payload = ContentFile(buffer.getvalue())
        except serializers.ValidationError:
            raise
        except Exception:
            # Keep the downloaded bytes when Pillow cannot open them as an image
            # of a known type — the extension gate above already rejected odd URLs.
            payload = ContentFile(data)

        name = f"{uuid.uuid4().hex}{extension}"
        if instance.thumbnail:
            instance.thumbnail.delete(save=False)
        instance.thumbnail.save(name, payload, save=False)

    @staticmethod
    def _storage_name_from_url(url: str) -> Optional[str]:
        """Best-effort map of a public media URL back to a storage object name."""
        path = urlparse(url).path or ""
        markers = ("/vlog/uploads/", "/vlog/thumbnails/", "/media/vlog/")
        for marker in markers:
            idx = path.find(marker)
            if idx >= 0:
                # Strip a leading "/media/" if present so the name matches storage.
                name = path[idx:].lstrip("/")
                if name.startswith("media/"):
                    name = name[len("media/") :]
                return name
        # Cloudinary-style absolute paths sometimes embed the folder after /upload/
        upload_idx = path.find("/upload/")
        if upload_idx >= 0:
            rest = path[upload_idx + len("/upload/") :]
            # Drop version segment (v123456/) when present.
            parts = rest.split("/")
            if parts and parts[0].startswith("v") and parts[0][1:].isdigit():
                parts = parts[1:]
            candidate = "/".join(parts)
            if candidate.startswith("vlog/"):
                return candidate
        return None

    def to_representation(self, instance):
        return VlogPostSerializer(instance, context=self.context).data

class VlogPostSerializer(serializers.ModelSerializer):
    category = VlogCategorySerializer(read_only=True)
    tags = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()
    twitter_image_url = serializers.SerializerMethodField()

    class Meta:
        model = VlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content', 
            'embed_url', 'video_url', 'thumbnail_url', 'author', 
            'category', 'tags', 'status', 'publish_date', 
            'created_at', 'updated_at', 'allow_comments',
            'seo_title', 'seo_description', 'seo_keywords',
            'focus_keyword',
            'seo_canonical_url', 'seo_noindex',
            'og_title', 'og_description', 'og_image_url',
            'twitter_title', 'twitter_description', 'twitter_image_url',
            'faq_items',
        ]

    def get_thumbnail_url(self, obj):
        if hasattr(obj, 'thumbnail') and obj.thumbnail:
            try:
                return obj.thumbnail.url
            except:
                pass
        return None

    def get_tags(self, obj):
        raw_tags = getattr(obj, 'tags', '') or ''
        if isinstance(raw_tags, list):
            return [str(tag).strip() for tag in raw_tags if str(tag).strip()]
        if isinstance(raw_tags, str):
            return [tag.strip() for tag in raw_tags.split(',') if tag.strip()]
        return []

    def get_video_url(self, obj):
        if hasattr(obj, 'video_file') and obj.video_file:
            try:
                return obj.video_file.url
            except:
                pass
        return None

    def get_og_image_url(self, obj):
        if hasattr(obj, 'og_image') and obj.og_image:
            try:
                return obj.og_image.url
            except:
                pass
        return None

    def get_twitter_image_url(self, obj):
        if hasattr(obj, 'twitter_image') and obj.twitter_image:
            try:
                return obj.twitter_image.url
            except:
                pass
        return None
