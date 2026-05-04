from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import numpy as np
import os
import sys

# Add parent directory to path so utils imports work correctly
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from utils.model_loader import (
    model, train_df, FEATURE_ORDER,
    encode_country, encode_category,
)
from utils.calibration import calibrate

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    category:          str   = Field(..., description="Industry display name e.g. 'Software'")
    country:           str   = Field(..., description="ISO country code e.g. 'IND'")
    funding_total_usd: float = Field(0, ge=0)
    funding_rounds:    int   = Field(0, ge=0)
    milestones:        int   = Field(0, ge=0)
    relationships:     int   = Field(0, ge=0)
    company_age:       int   = Field(0, ge=0)
    team_size:         int   = Field(1, ge=0)
    stage:             str   = Field("seed")

class Recommendation(BaseModel):
    feature:    str
    label:      str
    current:    float
    target:     float
    change_pct: Optional[float] = None

class PredictResponse(BaseModel):
    score:           float
    predicted_class: int
    predicted_label: str
    confidence:      float
    probabilities:   dict
    percentiles:     dict
    recommendations: list[Recommendation]
    region:          str

# ── Constants ─────────────────────────────────────────────────────────────────

CLASS_LABELS  = {0: "Failure", 1: "Neutral", 2: "Moderate Success", 3: "High Success"}
CLASS_WEIGHTS = {0: 0, 1: 3, 2: 7, 3: 10}

FEATURE_LABELS = {
    "milestones":        "Milestones achieved",
    "relationships":     "Strategic relationships",
    "funding_total_usd": "Total funding (USD)",
    "funding_rounds":    "Funding rounds",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def build_feature_vector(req: PredictRequest) -> np.ndarray:
    country_code = encode_country(req.country)
    cat_arr      = encode_category(req.category)
    num_arr      = np.array([
        float(country_code),
        float(req.funding_rounds),
        float(req.funding_total_usd),
        float(req.milestones),
        float(req.relationships),
        float(req.company_age),
    ]).reshape(1, -1)
    return np.hstack([num_arr, cat_arr])


def compute_global_score(probs: np.ndarray, classes) -> float:
    weighted = sum(
        float(probs[i]) * CLASS_WEIGHTS.get(int(classes[i]), 0)
        for i in range(len(classes))
    )
    return round(weighted, 2)


def bucket_probs(probs: np.ndarray, classes) -> dict:
    class_map = {int(c): float(p) for c, p in zip(classes, probs)}
    return {
        "Positive exit":  round(sum(v for k, v in class_map.items() if k >= 2), 4),
        "Sustainability": round(class_map.get(1, 0.0), 4),
        "Failure risk":   round(class_map.get(0, 0.0), 4),
    }


def compute_percentiles(req: PredictRequest) -> dict:
    if train_df is None:
        return {}
    cols = {
        "funding_total_usd": req.funding_total_usd,
        "company_age":       req.company_age,
        "milestones":        req.milestones,
        "relationships":     req.relationships,
    }
    result = {}
    for col, val in cols.items():
        if col in train_df.columns:
            pct = float((train_df[col].dropna() <= val).mean() * 100)
            result[col] = round(pct, 1)
    return result


def greedy_recommendations(x: np.ndarray, req: PredictRequest) -> list[Recommendation]:
    recs     = []
    base     = compute_global_score(model.predict_proba(x)[0], model.classes_)

    def test(feat: str, val: float) -> float:
        xt = x.copy()
        xt[0, FEATURE_ORDER.index(feat)] = val
        return compute_global_score(model.predict_proba(xt)[0], model.classes_)

    max_fund = float(train_df["funding_total_usd"].quantile(0.95)) if train_df is not None else req.funding_total_usd * 5
    max_mile = int(train_df["milestones"].quantile(0.95))          if train_df is not None else 30
    max_rel  = int(train_df["relationships"].quantile(0.95))       if train_df is not None else 100

    for delta in [3, 5, 8, 12, 20]:
        nv = req.milestones + delta
        if nv <= max_mile and test("milestones", float(nv)) > base:
            recs.append(Recommendation(feature="milestones", label=FEATURE_LABELS["milestones"],
                                       current=float(req.milestones), target=float(nv)))
            break

    for delta in [5, 10, 20, 35]:
        nv = req.relationships + delta
        if nv <= max_rel and test("relationships", float(nv)) > base:
            recs.append(Recommendation(feature="relationships", label=FEATURE_LABELS["relationships"],
                                       current=float(req.relationships), target=float(nv)))
            break

    for mult in [1.3, 1.6, 2.0, 3.0]:
        nv = min(max_fund, req.funding_total_usd * mult)
        if nv > req.funding_total_usd and test("funding_total_usd", nv) > base:
            cp = round((nv - req.funding_total_usd) / req.funding_total_usd * 100, 1) if req.funding_total_usd > 0 else None
            recs.append(Recommendation(feature="funding_total_usd", label=FEATURE_LABELS["funding_total_usd"],
                                       current=float(req.funding_total_usd), target=round(nv, 2), change_pct=cp))
            break

    return recs

# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        x = build_feature_vector(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Feature encoding error: {str(e)}")

    probs        = model.predict_proba(x)[0]
    classes      = model.classes_
    pred_idx     = int(np.argmax(probs))
    pred_class   = int(classes[pred_idx])
    pred_prob    = float(probs[pred_idx])
    global_score = compute_global_score(probs, classes)

    # Context-aware calibration
    cal            = calibrate(global_score, {
        "country_code":      req.country,
        "funding_total_usd": req.funding_total_usd,
        "milestones":        req.milestones,
        "relationships":     req.relationships,
        "company_age":       req.company_age,
        "team_size":         req.team_size,
        "stage":             req.stage,
    })
    adjusted_score = cal["adjusted_score"]
    region         = cal["region"]

    return PredictResponse(
        score           = adjusted_score,
        predicted_class = pred_class,
        predicted_label = CLASS_LABELS.get(pred_class, "Unknown"),
        confidence      = round(pred_prob, 4),
        probabilities   = bucket_probs(probs, classes),
        percentiles     = compute_percentiles(req),
        recommendations = greedy_recommendations(x, req),
        region          = region,
    )


@router.get("/categories")
def get_categories():
    from utils.model_loader import category_list_display
    return category_list_display


@router.get("/countries")
def get_countries():
    from utils.model_loader import country_list
    return country_list
