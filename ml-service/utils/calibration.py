"""
Context-Aware Calibration Layer (HSEE)
Adjusts ML global score to reflect regional ecosystem realities.
Indian early-stage startups are not penalised for lower funding
relative to US-centric training data.
"""

# ── Regional benchmarks ──────────────────────────────────────────────────────
REGION_BENCHMARKS = {
    "India": {
        "funding_low":            20_000,
        "funding_good":          100_000,
        "funding_excellent":     500_000,
        "milestones_good":       3,
        "milestones_excellent":  8,
        "relationships_good":    5,
        "relationships_excellent": 15,
    },
    "USA": {
        "funding_low":           200_000,
        "funding_good":        1_000_000,
        "funding_excellent":   5_000_000,
        "milestones_good":       5,
        "milestones_excellent":  12,
        "relationships_good":    10,
        "relationships_excellent": 25,
    },
    "Other": {
        "funding_low":            50_000,
        "funding_good":          300_000,
        "funding_excellent":   1_500_000,
        "milestones_good":       4,
        "milestones_excellent":  10,
        "relationships_good":    8,
        "relationships_excellent": 20,
    },
}

# Map ISO country codes → region key
def get_region(country_code: str) -> str:
    if country_code in ("IND",):
        return "India"
    if country_code in ("USA", "UMI"):
        return "USA"
    return "Other"

# ── Stage mapping (platform stages → bonus) ──────────────────────────────────
STAGE_BONUS = {
    "idea":     0.0,
    "pre-seed": 0.25,
    "seed":     0.5,
    "series-a": 1.0,
    "series-b": 1.0,
    "growth":   1.0,
}

# ── Context score (max ≈ 6) ───────────────────────────────────────────────────
def compute_context_score(inputs: dict, region: str) -> float:
    b = REGION_BENCHMARKS.get(region, REGION_BENCHMARKS["Other"])
    score = 0.0

    # Funding (0–2)
    f = inputs.get("funding_total_usd", 0)
    if f >= b["funding_excellent"]:
        score += 2.0
    elif f >= b["funding_good"]:
        score += 1.0
    elif f >= b["funding_low"]:
        score += 0.5

    # Milestones (0–1.5)
    m = inputs.get("milestones", 0)
    if m >= b["milestones_excellent"]:
        score += 1.5
    elif m >= b["milestones_good"]:
        score += 1.0

    # Relationships (0–1.5)
    r = inputs.get("relationships", 0)
    if r >= b["relationships_excellent"]:
        score += 1.5
    elif r >= b["relationships_good"]:
        score += 1.0

    # Early-stage age bonus (0–1)
    age = inputs.get("company_age", 0)
    if age <= 5:
        score += 1.0
    elif age <= 10:
        score += 0.5

    return round(score, 3)


# ── Additional signals (team size + stage) ────────────────────────────────────
def compute_additional_signals(inputs: dict) -> float:
    score = 0.0

    if inputs.get("team_size", 0) >= 5:
        score += 0.5

    stage = inputs.get("stage", "").lower()
    score += STAGE_BONUS.get(stage, 0.0)

    return round(score, 3)


# ── Final score calculation ───────────────────────────────────────────────────
def compute_final_score(global_score: float, context_score: float, extra_score: float, inputs: dict) -> float:
    # Strong startups are untouched — no artificial ceiling needed
    if global_score >= 7.0:
        return round(global_score, 2)

    boost = (context_score + extra_score) * 0.6
    final = global_score + boost

    # Fairness floor: early-stage startups with real traction get a minimum
    # Requires BOTH context_score >= 3 AND at least minimal execution proof
    has_execution = (
        inputs.get("milestones", 0) >= 1 or
        inputs.get("relationships", 0) >= 1 or
        inputs.get("funding_total_usd", 0) > 0
    )
    if final < 4.0 and context_score >= 3.0 and has_execution:
        final = 4.0 + (context_score * 0.3)

    return min(10.0, round(final, 2))


# ── Main entry point ──────────────────────────────────────────────────────────
def calibrate(global_score: float, inputs: dict) -> dict:
    """
    inputs must contain:
      country_code, funding_total_usd, milestones, relationships,
      company_age, team_size, stage
    Returns:
      adjusted_score  — the single score shown to users
      global_score    — raw ML score (kept internal)
      region          — detected region
    """
    region        = get_region(inputs.get("country_code", "Other"))
    context_score = compute_context_score(inputs, region)
    extra_score   = compute_additional_signals(inputs)
    adjusted      = compute_final_score(global_score, context_score, extra_score, inputs)

    return {
        "adjusted_score": adjusted,
        "global_score":   round(global_score, 2),
        "region":         region,
        # Internal detail — not surfaced to frontend
        "_context_score": context_score,
        "_extra_score":   extra_score,
    }
