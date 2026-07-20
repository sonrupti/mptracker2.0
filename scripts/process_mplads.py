import pandas as pd
from pathlib import Path

RAW = Path("../data/raw")
OUT = Path("../data/processed")

OUT.mkdir(exist_ok=True)

FILES = {
    "expenditure.csv": "mplads_expenditure.csv",
    "recommended.csv": "mplads_recommended.csv",
    "completed.csv": "mplads_completed.csv",
}

def clean(df):
    # Standardize column names
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("(", "", regex=False)
        .str.replace(")", "", regex=False)
        .str.replace("₹", "rupees", regex=False)
        .str.replace("/", "_")
    )

    # Remove duplicate rows
    df = df.drop_duplicates()

    # Remove completely empty rows
    df = df.dropna(how="all")

    # Clean text columns
    for col in df.select_dtypes(include="object"):
        df[col] = df[col].astype(str).str.strip()

    # Convert amount columns
    for col in df.columns:
        if "amount" in col:
            df[col] = (
                df[col]
                .astype(str)
                .str.replace(",", "", regex=False)
                .str.replace("₹", "", regex=False)
            )
            df[col] = pd.to_numeric(df[col], errors="coerce")

    return df

for infile, outfile in FILES.items():

    print(f"Processing {infile}")

    df = pd.read_csv(RAW / infile)

    df = clean(df)

    df.to_csv(OUT / outfile, index=False)

    print(f"Saved {outfile}")

print("\nDone.")