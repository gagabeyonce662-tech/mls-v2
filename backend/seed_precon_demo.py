from decimal import Decimal

from django.db import transaction

from mls.models import (
    EstateAmenity,
    EstateContentSection,
    EstateDepositInstallment,
    EstateDepositPlan,
    EstateIncentive,
    EstatePrice,
    EstateProject,
    EstateUnitType,
)


PROJECTS = {
    "wp-18264": {
        "overview": """
            <p>
                Avalon is a master-planned pre-construction community by Empire
                Communities in Caledonia. The development offers modern townhomes
                designed for families, first-time buyers, and long-term investors.
            </p>
            <p>
                Residents will enjoy convenient access to Hamilton, Highway 6,
                schools, shopping, parks, and everyday services.
            </p>
        """,
        "unit_types": [
            "Townhomes",
            "Village Townhomes",
        ],
        "prices": [
            ("Townhomes", "Starting from $564,990", "564990"),
            ("Village Townhomes", "Starting from $599,990", "599990"),
        ],
        "deposits": [
            (
                "Townhomes deposit structure",
                [
                    ("On signing", "$10,000", "10000", None),
                    ("Within 30 days", "$10,000", "10000", None),
                    ("Within 60 days", "$10,000", "10000", None),
                    ("Within 90 days", "$10,000", "10000", None),
                    ("Within 150 days", "$20,000", "20000", None),
                    ("Within 210 days", "Balance to 10%", None, "10"),
                ],
            ),
        ],
        "incentives": [
            "Five appliances included",
            "Free assignment",
            "$6,000 in décor dollars",
            "Capped development charges",
        ],
        "amenities": [
            "Approximately 3 minutes to Highway 6",
            "Approximately 15 minutes to Highway 403",
            "Close to schools, parks, and shopping",
            "Convenient access to Hamilton",
        ],
    },
    "wp-18312": {
        "overview": """
            <p>
                Riverland is a family-oriented community by Empire Communities
                in Breslau, between Kitchener, Waterloo, Cambridge, and Guelph.
            </p>
            <p>
                The community combines suburban living with access to employment
                centres, schools, recreation, and major transportation routes.
            </p>
        """,
        "unit_types": [
            "Townhomes",
            "Semi-detached homes",
            "Detached homes",
        ],
        "prices": [
            ("Townhomes", "Starting from $749,990", "749990"),
            ("Semi-detached homes", "Starting from $849,990", "849990"),
            ("Detached homes", "Starting from $999,990", "999990"),
        ],
        "deposits": [
            (
                "Townhomes deposit structure",
                [
                    ("On signing", "$20,000", "20000", None),
                    ("Within 30 days", "$20,000", "20000", None),
                    ("Within 60 days", "$20,000", "20000", None),
                    ("Within 90 days", "$20,000", "20000", None),
                    ("Within 180 days", "Balance to 10%", None, "10"),
                ],
            ),
        ],
        "incentives": [
            "Five appliances included",
            "Free assignment",
            "Décor centre credit",
            "Capped development charges",
        ],
        "amenities": [
            "Close to Kitchener, Waterloo, Cambridge, and Guelph",
            "Minutes from Highway 7",
            "Nearby schools and recreation",
            "Access to shopping and daily services",
        ],
    },
    "wp-18319": {
        "overview": """
            <p>
                Wyndfield is an established master-planned community by Empire
                Communities in Brantford. It offers modern townhomes and detached
                homes in a growing residential neighbourhood.
            </p>
            <p>
                The community is designed around parks, schools, trails, shopping,
                and convenient access to Highway 403.
            </p>
        """,
        "unit_types": [
            "Townhomes",
            "Semi-detached homes",
            "Detached homes",
        ],
        "prices": [
            ("Townhomes", "Starting from $564,990", "564990"),
            ("Semi-detached homes", "Starting from $699,990", "699990"),
            ("Detached homes", "Starting from $799,990", "799990"),
        ],
        "deposits": [
            (
                "Townhomes deposit structure",
                [
                    ("On signing", "$10,000", "10000", None),
                    ("Within 30 days", "$10,000", "10000", None),
                    ("Within 60 days", "$10,000", "10000", None),
                    ("Within 90 days", "$10,000", "10000", None),
                    ("Within 180 days", "Balance to 10%", None, "10"),
                ],
            ),
        ],
        "incentives": [
            "Free assignment",
            "Appliance package included",
            "Décor centre bonus",
            "Capped development charges",
        ],
        "amenities": [
            "Close to Highway 403",
            "Nearby schools and parks",
            "Access to shopping and restaurants",
            "Community trails and green space",
        ],
    },
    "wp-18943": {
        "overview": """
            <p>
                Legacy is a pre-construction community by Empire Communities in
                Thorold. It features townhomes and detached homes near Highway 406,
                Brock University, shopping, schools, and Niagara attractions.
            </p>
            <p>
                The project offers multiple home collections suitable for families,
                move-up buyers, and investors.
            </p>
        """,
        "unit_types": [
            "Rear-lane townhomes",
            "20-foot townhomes",
            "33-foot detached homes",
            "38-foot detached homes",
        ],
        "prices": [
            ("Rear-lane townhomes", "Starting from the mid $500s", "560000"),
            ("20-foot townhomes", "Starting from the high $500s", "599000"),
            ("33-foot detached homes", "Starting from the high $700s", "799000"),
            ("38-foot detached homes", "Starting from the high $800s", "899000"),
        ],
        "deposits": [
            (
                "Townhomes deposit structure",
                [
                    ("On signing", "$10,000", "10000", None),
                    ("Within 30 days", "$10,000", "10000", None),
                    ("Within 60 days", "$10,000", "10000", None),
                    ("Within 90 days", "$10,000", "10000", None),
                    ("Within 150 days", "$20,000", "20000", None),
                    ("Within 210 days", "Balance to 10%", None, "10"),
                ],
            ),
            (
                "33-foot detached homes deposit structure",
                [
                    ("On signing", "$10,000", "10000", None),
                    ("Within 30 days", "$10,000", "10000", None),
                    ("Within 60 days", "$20,000", "20000", None),
                    ("Within 90 days", "$20,000", "20000", None),
                    ("Within 150 days", "$20,000", "20000", None),
                    ("Within 210 days", "Balance to 10%", None, "10"),
                ],
            ),
            (
                "38-foot detached homes deposit structure",
                [
                    ("On signing", "$10,000", "10000", None),
                    ("Within 30 days", "$10,000", "10000", None),
                    ("Within 60 days", "$25,000", "25000", None),
                    ("Within 90 days", "$25,000", "25000", None),
                    ("Within 150 days", "$25,000", "25000", None),
                    ("Within 210 days", "Balance to 10%", None, "10"),
                ],
            ),
        ],
        "incentives": [
            "$5,000 in décor dollars on townhomes",
            "$10,000 in décor dollars on detached homes",
            "Five appliances included",
            "Kitchen backsplash included",
            "Quartz kitchen countertops",
            "Free assignment",
        ],
        "amenities": [
            "Close to Highway 406",
            "Near Brock University",
            "Access to Niagara shopping and attractions",
            "Nearby parks, schools, and recreation",
        ],
    },
    "wp-18954": {
        "overview": """
            <p>
                Ellis Lane is a pre-construction community by Mattamy Homes in
                Caledon. It offers contemporary townhomes and detached homes in
                a growing neighbourhood near Brampton and major commuter routes.
            </p>
            <p>
                The community combines modern home designs with access to parks,
                schools, shopping, and everyday services.
            </p>
        """,
        "unit_types": [
            "Townhomes",
            "Semi-detached homes",
            "Detached homes",
        ],
        "prices": [
            ("Townhomes", "Starting from the low $800s", "800000"),
            ("Semi-detached homes", "Starting from the low $900s", "900000"),
            ("Detached homes", "Starting from over $1 million", "1000000"),
        ],
        "deposits": [
            (
                "Townhomes deposit structure",
                [
                    ("On signing", "$20,000", "20000", None),
                    ("Within 30 days", "$20,000", "20000", None),
                    ("Within 60 days", "$20,000", "20000", None),
                    ("Within 90 days", "$20,000", "20000", None),
                    ("Within 180 days", "Balance to 10%", None, "10"),
                ],
            ),
        ],
        "incentives": [
            "Appliance package included",
            "Décor centre credit",
            "Free assignment",
            "Capped development charges",
        ],
        "amenities": [
            "Close to Brampton and Mississauga",
            "Access to Highway 410",
            "Nearby schools and parks",
            "Shopping and daily services nearby",
        ],
    },
}


def money(value):
    return Decimal(value) if value is not None else None


@transaction.atomic
def seed_project(source_id, data):
    project = EstateProject.objects.get(
        source="wordpress",
        source_id=source_id,
    )

    # Remove only generated structured data for these five demo projects.
    # The main EstateProject record and featured image remain untouched.
    EstateDepositInstallment.objects.filter(
        plan__project=project
    ).delete()
    EstateDepositPlan.objects.filter(project=project).delete()
    EstatePrice.objects.filter(project=project).delete()
    EstateUnitType.objects.filter(project=project).delete()
    EstateIncentive.objects.filter(project=project).delete()
    EstateAmenity.objects.filter(project=project).delete()
    EstateContentSection.objects.filter(project=project).delete()

    EstateContentSection.objects.create(
        project=project,
        heading="Overview",
        html=data["overview"],
        display_order=0,
        source_key="demo:overview",
        parser_owned=False,
    )

    units = {}

    for order, name in enumerate(data["unit_types"]):
        unit = EstateUnitType.objects.create(
            project=project,
            name=name,
            description="",
            display_order=order,
            source_key=f"demo:unit:{order}",
            parser_owned=False,
        )
        units[name] = unit

    for order, (unit_name, display_text, amount) in enumerate(data["prices"]):
        EstatePrice.objects.create(
            project=project,
            unit_type=units.get(unit_name),
            display_text=display_text,
            amount=money(amount),
            currency="CAD",
            display_order=order,
            source_key=f"demo:price:{order}",
            parser_owned=False,
        )

    for plan_order, (title, installments) in enumerate(data["deposits"]):
        plan = EstateDepositPlan.objects.create(
            project=project,
            title=title,
            display_order=plan_order,
            source_key=f"demo:deposit-plan:{plan_order}",
            parser_owned=False,
        )

        for order, (milestone, text, amount, percentage) in enumerate(installments):
            EstateDepositInstallment.objects.create(
                plan=plan,
                milestone=milestone,
                amount_text=text,
                amount=money(amount),
                percentage=money(percentage),
                display_order=order,
                source_key=f"demo:installment:{plan_order}:{order}",
                parser_owned=False,
            )

    for order, description in enumerate(data["incentives"]):
        EstateIncentive.objects.create(
            project=project,
            description=description,
            display_order=order,
            source_key=f"demo:incentive:{order}",
            parser_owned=False,
        )

    for order, description in enumerate(data["amenities"]):
        EstateAmenity.objects.create(
            project=project,
            description=description,
            display_order=order,
            source_key=f"demo:amenity:{order}",
            parser_owned=False,
        )

    print(f"Seeded {source_id}: {project.title}")


for source_id, project_data in PROJECTS.items():
    seed_project(source_id, project_data)

print("Completed demo seeding for five pre-construction projects.")