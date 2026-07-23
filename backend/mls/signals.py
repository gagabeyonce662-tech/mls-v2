from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Content, PreComProperty


@receiver(post_save, sender=Content)
def create_precom_property_for_content(sender, instance, **kwargs):
    """Keep every manually-created pre-con Content record listable.

    The public pre-con endpoints query PreComProperty, not Content.  Creating
    the related row here avoids a second, easy-to-miss admin step.
    """
    if instance.content_type == Content.PROPERTY:
        PreComProperty.objects.get_or_create(content=instance)
