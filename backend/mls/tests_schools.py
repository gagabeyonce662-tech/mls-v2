from django.test import SimpleTestCase

from mls.services.ontario_schools import (
    eqao_percent,
    load_schools,
    schools_near,
    search_schools,
    top_gta_schools,
)


def _school(**overrides):
    row = {
        "id": "1",
        "name": "Test Public School",
        "board": "Toronto DSB",
        "kind": "Public",
        "level": "Elementary",
        "city": "Toronto",
        "website": "https://example.com",
        "lat": 43.700,
        "lon": -79.400,
        "g3_read": 80,
        "g3_write": 70,
        "g3_math": 60,
        "g6_read": None,
        "g6_write": None,
        "g6_math": None,
        "g9_math": None,
        "osslt": None,
    }
    row.update(overrides)
    return row


class OntarioSchoolTests(SimpleTestCase):
    def test_eqao_average_uses_only_published_subjects(self):
        self.assertEqual(eqao_percent(_school()), 70)
        self.assertIsNone(eqao_percent(_school(g3_read=None, g3_write=None, g3_math=None)))

    def test_secondary_average_ignores_elementary_subjects(self):
        school = _school(level="Secondary", g9_math=90, osslt=80, g3_read=10)
        self.assertEqual(eqao_percent(school), 85)

    def test_near_keeps_the_closest_of_each_level(self):
        schools = [
            _school(id="far", name="Far Elementary", lat=43.80),
            _school(id="near", name="Near Elementary", lat=43.701),
            _school(id="sec", name="Near Secondary", level="Secondary", lat=43.702, g9_math=88, osslt=92),
        ]
        found = schools_near(43.700, -79.400, radius_km=8, schools=schools)
        self.assertEqual([school["name"] for school in found], ["Near Elementary", "Near Secondary"])
        self.assertEqual(found[1]["eqao_percent"], 90)
        self.assertLess(found[0]["distance_km"], 1)

    def test_top_list_is_gta_secondary_only(self):
        schools = [
            _school(name="City High", level="Secondary", lat=43.7, lon=-79.4, g9_math=95, osslt=95),
            _school(name="City Elementary", level="Elementary", lat=43.7, lon=-79.4, g3_read=99, g3_write=99, g3_math=99),
            _school(name="North High", level="Secondary", lat=46.5, lon=-84.3, g9_math=99, osslt=99),
        ]
        found = top_gta_schools(limit=4, schools=schools)
        self.assertEqual([school["name"] for school in found], ["City High"])

    def test_open_data_file_loads(self):
        schools = load_schools()
        self.assertGreater(len(schools), 4000)
        named = [school for school in schools if school["name"] == "Earl Haig Secondary School"]
        self.assertTrue(named)
        self.assertEqual(named[0]["level"], "Secondary")
        self.assertIsInstance(named[0]["lat"], float)

    def test_search_matches_school_name_tokens(self):
        schools = [
            _school(id="1", name="John Fraser Secondary School", city="Mississauga", level="Secondary", g9_math=88, osslt=88),
            _school(id="2", name="Fraser Public School", city="Toronto", level="Elementary"),
            _school(id="3", name="Unrelated Academy", city="Oakville", level="Secondary", g9_math=70, osslt=70),
        ]
        found = search_schools("fraser secondary", limit=5, schools=schools)
        self.assertEqual([school["name"] for school in found], ["John Fraser Secondary School"])
