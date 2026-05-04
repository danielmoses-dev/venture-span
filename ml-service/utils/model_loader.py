import joblib
import json
import pandas as pd
from pathlib import Path

MODELS_DIR   = Path(__file__).parent.parent / "models"
MAPPINGS_DIR = Path(__file__).parent.parent / "mappings"

# Load model artifacts
model = joblib.load(MODELS_DIR / "gradient_boosting_startup_model.joblib")
ohe   = joblib.load(MODELS_DIR / "category_ohe.joblib")

# Load mapping files
with open(MAPPINGS_DIR / "category_display_to_original.json") as f:
    display_to_original: dict = json.load(f)

with open(MAPPINGS_DIR / "category_list_display.json") as f:
    category_list_display: list = json.load(f)

with open(MAPPINGS_DIR / "country_list.json") as f:
    country_list: list = json.load(f)

with open(MAPPINGS_DIR / "dice_meta.json") as f:
    dice_meta: dict = json.load(f)

# OHE feature names
try:
    ohe_feature_names: list = list(ohe.get_feature_names_out(["category_code"]))
except Exception:
    ohe_feature_names = [f"category_code_{c}" for c in ohe.categories_[0]]

# CRITICAL: model expects numeric first, then OHE category
NUMERIC_FEATURES = ["country_code", "funding_rounds", "funding_total_usd", "milestones", "relationships", "company_age"]
FEATURE_ORDER    = NUMERIC_FEATURES + ohe_feature_names

# Training data for percentile computation and DiCE
try:
    train_df = pd.read_csv(MAPPINGS_DIR / "dice_train_df.csv")
except Exception:
    train_df = None

# Country → binary encoding (matches training data: USA=1, all others=0)
def encode_country(country: str) -> int:
    return 1 if country == "USA" else 0

# Category display name → original code → OHE
def encode_category(category_display: str):
    original = display_to_original.get(category_display, category_display.lower().replace(" ", "_"))
    return ohe.transform([[original]])
