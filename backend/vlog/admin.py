from django.contrib import admin
from .models import VlogPost, VlogCategory
from django.utils.html import format_html
from django import forms
from django.conf import settings

class VlogPostAdminForm(forms.ModelForm):
    # Use plain FileInput so admin rendering does not require resolving remote
    # storage URLs for existing files (can fail if storage env is misconfigured).
    video_file = forms.FileField(required=False, widget=forms.FileInput())
    thumbnail = forms.ImageField(required=False, widget=forms.FileInput())
    og_image = forms.ImageField(required=False, widget=forms.FileInput())
    twitter_image = forms.ImageField(required=False, widget=forms.FileInput())

    content = forms.CharField(
        widget=forms.Textarea(
            attrs={
                "rows": 24,
                "style": "font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;",
            }
        ),
        help_text=(
            "Write content in Markdown. Supports headings, lists, links, tables, and emphasis."
        ),
    )

    class Meta:
        model = VlogPost
        fields = '__all__'

@admin.register(VlogPost)
class VlogPostAdmin(admin.ModelAdmin):
    form = VlogPostAdminForm
    list_display = ('title', 'author', 'status', 'publish_date', 'thumbnail_tag')
    list_filter = ('status', 'category', 'author')
    search_fields = ('title', 'excerpt', 'content', 'tags')
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ('thumbnail_tag', 'created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'excerpt', 'content', 'category', 'tags')
        }),
        ('Media', {
            'fields': ('embed_url', 'video_file', 'thumbnail', 'thumbnail_tag')
        }),
        ('Publication', {
            'fields': ('status', 'publish_date', 'author', 'allow_comments')
        }),
        ('SEO', {
            'description': (
                "WordPress-style SEO overrides. Leave empty to auto-fallback to title/excerpt/content."
            ),
            'fields': (
                'seo_title',
                'seo_description',
                'seo_keywords',
                'focus_keyword',
                'seo_canonical_url',
                'seo_noindex',
                'og_title',
                'og_description',
                'og_image',
                'twitter_title',
                'twitter_description',
                'twitter_image',
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def thumbnail_tag(self, obj):
        if obj.thumbnail:
            try:
                return format_html('<img src="{}" width="150" style="object-fit:cover;"/>', obj.thumbnail.url)
            except Exception:
                # Keep admin list page usable even if remote media storage is misconfigured.
                if settings.DEBUG:
                    raise
                return "(Thumbnail unavailable)"
        return "(No thumbnail)"
    thumbnail_tag.short_description = "Thumbnail"

@admin.register(VlogCategory)
class VlogCategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}
