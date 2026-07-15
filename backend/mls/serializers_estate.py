from rest_framework import serializers
from .models import (
    EstateAmenity, EstateContentSection, EstateDepositInstallment, EstateDepositPlan,
    EstateDocument, EstateIncentive, EstatePrice, EstateProject, EstateUnitType,
)


class EstateUnitTypeSerializer(serializers.ModelSerializer):
    class Meta: model = EstateUnitType; fields = ["id", "name", "description", "display_order"]


class EstatePriceSerializer(serializers.ModelSerializer):
    class Meta: model = EstatePrice; fields = ["id", "unit_type_id", "display_text", "amount", "currency", "display_order"]


class EstateInstallmentSerializer(serializers.ModelSerializer):
    class Meta: model = EstateDepositInstallment; fields = ["id", "milestone", "amount_text", "amount", "percentage", "display_order"]


class EstateDepositPlanSerializer(serializers.ModelSerializer):
    installments = EstateInstallmentSerializer(many=True, read_only=True)
    class Meta: model = EstateDepositPlan; fields = ["id", "unit_type_id", "title", "display_order", "installments"]


class EstateSectionSerializer(serializers.ModelSerializer):
    class Meta: model = EstateContentSection; fields = ["id", "heading", "html", "display_order"]


class EstateIncentiveSerializer(serializers.ModelSerializer):
    class Meta: model = EstateIncentive; fields = ["id", "description", "display_order"]


class EstateAmenitySerializer(serializers.ModelSerializer):
    class Meta: model = EstateAmenity; fields = ["id", "description", "travel_time_minutes", "display_order"]


class EstateDocumentSerializer(serializers.ModelSerializer):
    class Meta: model = EstateDocument; fields = ["id", "label", "document_type", "requires_phone_verification", "display_order"]


class EstateProjectSerializer(serializers.ModelSerializer):
    sections = EstateSectionSerializer(many=True, read_only=True)
    unit_types = EstateUnitTypeSerializer(many=True, read_only=True)
    prices = EstatePriceSerializer(many=True, read_only=True)
    deposit_plans = EstateDepositPlanSerializer(many=True, read_only=True)
    incentives = EstateIncentiveSerializer(many=True, read_only=True)
    amenities = EstateAmenitySerializer(many=True, read_only=True)
    documents = EstateDocumentSerializer(many=True, read_only=True)
    class Meta:
        model = EstateProject
        exclude = ["source_id"]


class EstateProjectListSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstateProject
        fields = ["id", "title", "slug", "publication_status", "developer", "occupancy_year", "address", "city", "province", "featured_image_url", "is_featured"]
