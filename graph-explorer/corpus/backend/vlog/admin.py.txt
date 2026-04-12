from django.contrib import admin
from .models import VlogPost, VlogCategory
from django.utils.html import format_html
from ckeditor_uploader.widgets import CKEditorUploadingWidget
from django import forms

class VlogPostAdminForm(forms.ModelForm):
    content = forms.CharField(widget=CKEditorUploadingWidget())

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
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def thumbnail_tag(self, obj):
        if obj.thumbnail:
            return format_html('<img src="{}" width="150" style="object-fit:cover;"/>', obj.thumbnail.url)
        return "(No thumbnail)"
    thumbnail_tag.short_description = "Thumbnail"

@admin.register(VlogCategory)
class VlogCategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}
