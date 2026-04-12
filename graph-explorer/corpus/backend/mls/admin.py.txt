# admin.py
from django.contrib import admin
from .models import Property, Room, Media

class RoomInline(admin.TabularInline):
    model = Room
    extra = 1

class MediaInline(admin.TabularInline):
    model = Media
    extra = 1

class PropertyAdmin(admin.ModelAdmin):
    list_display = ('listing_key','category_type','list_price', 'property_sub_type', 'city', 'state_or_province')
    search_fields = ('listing_key', 'city', 'state_or_province')
    inlines = [RoomInline, MediaInline]

class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_type', 'room_length', 'room_width', 'room_level')
    search_fields = ('room_type',)

class MediaAdmin(admin.ModelAdmin):
    list_display = ('media_url', 'media_category', 'order', 'is_preferred')
    search_fields = ('media_category',)

admin.site.register(Property, PropertyAdmin)
admin.site.register(Room, RoomAdmin)
admin.site.register(Media, MediaAdmin)
