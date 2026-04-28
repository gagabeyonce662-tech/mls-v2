from django.contrib import admin
from .models import VlogPost, VlogCategory
from django.utils.html import format_html
from django import forms
from django.conf import settings
from django.utils.safestring import mark_safe

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
    readonly_fields = ('thumbnail_tag', 'seo_analysis', 'created_at', 'updated_at')
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
                'seo_analysis',
            )
        }),
        ('FAQ', {
            'description': "Optional FAQ entries. Provide a JSON array of {question, answer} pairs.",
            'fields': ('faq_items',),
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

    def seo_analysis(self, obj):
        focus = (obj.focus_keyword or "").strip().lower()
        title = ((obj.seo_title or "").strip() or (obj.title or "").strip())
        description = ((obj.seo_description or "").strip() or (obj.excerpt or "").strip())
        slug = (obj.slug or "").strip()
        excerpt = (obj.excerpt or "").strip().lower()
        content = (obj.content or "").strip().lower()

        title_len = len(title)
        description_len = len(description)
        social_image = bool(obj.twitter_image or obj.og_image or obj.thumbnail)

        def pass_fail(ok):
            return "PASS" if ok else "WARN"

        in_title = bool(focus and focus in title.lower())
        in_slug = bool(focus and focus in slug.lower())
        in_excerpt = bool(focus and focus in excerpt)
        in_content = bool(focus and focus in content)

        lines = [
            f"Title length ({title_len}): {pass_fail(30 <= title_len <= 65)}",
            f"Description length ({description_len}): {pass_fail(70 <= description_len <= 170)}",
            f"Focus keyword set: {pass_fail(bool(focus))}",
            f"Focus in title: {pass_fail(in_title)}",
            f"Focus in slug: {pass_fail(in_slug)}",
            f"Focus in excerpt: {pass_fail(in_excerpt)}",
            f"Focus in content: {pass_fail(in_content)}",
            f"Social image available: {pass_fail(social_image)}",
        ]
        return mark_safe("<br/>".join(lines))

    seo_analysis.short_description = "SEO analysis"

@admin.register(VlogCategory)
class VlogCategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}
