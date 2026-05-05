from __future__ import annotations

from typing import Any, Dict, Optional

from mls.models import Agent, AgentServiceArea


def _norm(s: Optional[str]) -> str:
    return (s or "").strip().lower()


def match_agent(fsa: Optional[str], city: Optional[str], city_region: Optional[str]) -> Optional[Dict[str, Any]]:
    fsa3 = (fsa or "").replace(" ", "").upper()[:3] if fsa else ""
    city_k = _norm(city)
    region_k = _norm(city_region)

    def serialize(a: Agent) -> Dict[str, Any]:
        return {
            "id": a.id,
            "name": a.name,
            "email": a.email or "",
            "phone": a.phone or "",
            "photo_url": a.photo_url or "",
            "brokerage": a.brokerage or "",
            "bio": a.bio or "",
        }

    if len(fsa3) == 3:
        a = (
            Agent.objects.filter(is_active=True, service_areas__kind=AgentServiceArea.KIND_FSA, service_areas__key__iexact=fsa3)
            .distinct()
            .first()
        )
        if a:
            return serialize(a)

    if city_k:
        a = (
            Agent.objects.filter(is_active=True, service_areas__kind=AgentServiceArea.KIND_CITY, service_areas__key=city_k)
            .distinct()
            .first()
        )
        if a:
            return serialize(a)

    if region_k:
        a = (
            Agent.objects.filter(
                is_active=True,
                service_areas__kind=AgentServiceArea.KIND_REGION,
                service_areas__key=region_k,
            )
            .distinct()
            .first()
        )
        if a:
            return serialize(a)

    return None
