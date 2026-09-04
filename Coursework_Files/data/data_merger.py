import pandas as pd
import numpy as np

###############################################
# LOAD DATA
###############################################

wealth = pd.read_csv(r"C:\Users\einob\OneDrive - King's College London\AA - Intro to Data Vis\Coursework Files\Datasets\GDL-Mean-International-Wealth-Index-(IWI)-score-of-region-data.csv")
gini = pd.read_csv(r"C:\Users\einob\OneDrive - King's College London\AA - Intro to Data Vis\Coursework Files\Datasets\GINI_data.csv")
edu = pd.read_csv(r"C:\Users\einob\OneDrive - King's College London\AA - Intro to Data Vis\Coursework Files\Datasets\world-education-data.csv")

###############################################
# CLEAN WEALTH INDEX (wide → long)
###############################################

# Keep only national-level rows
#all rows on a subnational/regional level are removed
wealth_nat = wealth[wealth["Level"] == "National"].copy()

# Identify year columns (1992–2023)
year_cols = [col for col in wealth_nat.columns if str(col).isdigit()]

# Melt to long format
wealth_long = wealth_nat.melt(
    id_vars=["Country", "ISO_Code"],
    value_vars=year_cols,
    var_name="year",
    value_name="wealth_index"
)

wealth_long["year"] = wealth_long["year"].astype(int)

###############################################
# CLEAN GINI INDEX (wide → long)
###############################################

# Identify year columns
gini_years = [col for col in gini.columns if col.isdigit()]

gini_long = gini.melt(
    id_vars=["Country Name", "Country Code"],
    value_vars=gini_years,
    var_name="year",
    value_name="gini_index"
)

gini_long["year"] = gini_long["year"].astype(int)

# Rename for consistency
gini_long = gini_long.rename(columns={
    "Country Name": "Country",
    "Country Code": "ISO_Code"
})

###############################################
# CLEAN EDUCATION DATA (already long format)
###############################################

edu_clean = edu.rename(columns={
    "country": "Country",
    "country_code": "ISO_Code"
})

###############################################
# MERGE ALL THREE DATASETS
###############################################

# Merge wealth + gini
df = pd.merge(
    wealth_long,
    gini_long,
    on=["ISO_Code", "Country", "year"],
    how="left"
)

# Merge education
df = pd.merge(
    df,
    edu_clean,
    on=["ISO_Code", "Country", "year"],
    how="left"
)
#RESULT IS 132 COUNTRIES

###############################################
#change format of percentage columns
###############################################
pct_cols = [
    "gov_exp_pct_gdp",
    "lit_rate_adult_pct",
    "pri_comp_rate_pct",
    "school_enrol_primary_pct",
    "school_enrol_secondary_pct",
    "school_enrol_tertiary_pct"
]

df[pct_cols] = df[pct_cols] / 100

###############################################
#Rename the columns for readability
###############################################

df = df.rename(columns={
    "Country": "Country",
    "ISO_Code": "ISO Code",
    "year": "Year",
    "wealth_index": "Wealth Index",
    "gini_index": "GINI Index",
    "gov_exp_pct_gdp": "% of GDP Spent On Education",
    "lit_rate_adult_pct": "Adult Literacy Rate %",
    "pri_comp_rate_pct": "Primary School Completion Rate %",
    "pupil_teacher_primary": "Primary Pupil-Teacher Ratio",
    "pupil_teacher_secondary": "Secondary Pupil-Teacher Ratio",
    "school_enrol_primary_pct": "Primary School Enrollment %",
    "school_enrol_secondary_pct": "Secondary School Enrollment %",
    "school_enrol_tertiary_pct": "Tertiary School Enrollment %"
})

###############################################
# ADDITIONAL CLEANING
###############################################

# Sort for readability
df = df.sort_values(["Country", "Year"]).reset_index(drop=True)

# Identify the columns that contain actual data (exclude identifiers)
data_cols = df.columns.difference(["Country", "ISO Code", "Year"])

# Remove rows where ALL data columns are MISSING
df = df.dropna(subset=data_cols, how="all")


###############################################
# 7. SAVE FINAL DATASET
###############################################


output_path = "C:/Users/einob/OneDrive - King's College London/AA - Intro to Data Vis/Coursework Files/Datasets/combined_dataset.csv"

df.to_csv(output_path, index=False)

print("Final dataset shape:", df.shape)
print(df.head())
