class SectionedAdminMixin:
    change_form_template = "admin/sectioned_change_form.html"

    class Media:
        css = {
            "all": ("admin/css/sectioned-admin.css",),
        }
        js = ("admin/js/sectioned-admin.js",)
