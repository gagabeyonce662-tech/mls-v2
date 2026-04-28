from django.db import models
from django.utils.text import slugify
from django.urls import reverse
from ckeditor_uploader.fields import RichTextUploadingField
from django.contrib.auth import get_user_model

User = get_user_model()

class VlogCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    class Meta:
        verbose_name = "Blog Category"
        verbose_name_plural = "Blog Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


def thumbnail_upload_path(instance, filename):
    return f'vlog/thumbnails/{instance.slug or instance.title}/{filename}'

def video_upload_path(instance, filename):
    return f'vlog/videos/{instance.slug or instance.title}/{filename}'

class VlogPost(models.Model):
    DRAFT = "draft"
    PUBLISHED = "published"
    STATUS_CHOICES = [(DRAFT, "Draft"), (PUBLISHED, "Published")]

    title = models.CharField(max_length=250)
    slug = models.SlugField(max_length=270, unique=True, blank=True)
    excerpt = models.TextField(blank=True)
    content = RichTextUploadingField()
    # Video support: either embed_url (YouTube/Vimeo) OR upload a video file
    embed_url = models.URLField(blank=True, help_text="YouTube/Vimeo share link (optional)")
    video_file = models.FileField(upload_to=video_upload_path, blank=True, null=True)
    thumbnail = models.ImageField(upload_to=thumbnail_upload_path, blank=True, null=True)

    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    category = models.ForeignKey(VlogCategory, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.CharField(max_length=250, blank=True, help_text="Comma-separated tags (optional)")

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=DRAFT)
    publish_date = models.DateTimeField(blank=True, null=True, help_text="When to publish; leave empty for now")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    allow_comments = models.BooleanField(default=True)
    is_manual = models.BooleanField(default=False, help_text="If true, automated sync will not overwrite this post")

    class Meta:
        verbose_name = "Blog Post"
        verbose_name_plural = "Blog Posts"
        ordering = ['-publish_date', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['-publish_date']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            # basic slugify + uniqueness check
            base = slugify(self.title)[:200]
            slug = base
            i = 1
            while VlogPost.objects.filter(slug=slug).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('vlog:detail', kwargs={'slug': self.slug})

    def __str__(self):
        return self.title
