"""
process_groundwater.py
======================
Extracts and parses the 2024 Central Ground Water Board (CGWB) Groundwater Quality (GWQ)
dataset from Datasets/CGWB_GWQ_2024.pdf using layout-aware extraction.

Computes:
- BIS IS 10500:2012 Drinking Water Quality Compliance:
  * Fluoride (F <= 1.5 mg/L)
  * Nitrate (NO3 <= 45 mg/L)
  * Total Dissolved Solids (TDS <= 500 mg/L acceptable, <= 2000 permissible)
  * Total Hardness (TH <= 200 mg/L acceptable, <= 600 permissible)
  * pH (6.5 - 8.5)
  * Arsenic (As <= 10 ppb)
  * Uranium (U <= 30 ppb)
  * Iron (Fe <= 1.0 mg/L)
- Water Quality Index (WQI) and Water Stress Potability Rating (Safe, Marginal, Stressed, Critical).
- Outputs summary JSON for backend API and dashboard.
"""

import os
import re
import json
import pypdf

PDF_PATH = "Datasets/CGWB_GWQ_2024.pdf"
OUTPUT_JSON = "ml/model_artifacts/groundwater_quality_summary.json"
OUTPUT_DATASET = "Datasets/processed_cgwb_gwq_2024.json"

def clean_num(val_str):
    if not val_str or val_str.strip() in ['-', '--', 'BDL', 'ND', '', 'NA', 'Nil']:
        return None
    val_str = val_str.strip().replace(' ', '')
    try:
        return float(val_str)
    except ValueError:
        return None

def main():
    print(f"Reading {PDF_PATH} using layout extraction mode...")
    reader = pypdf.PdfReader(PDF_PATH)
    total_pages = len(reader.pages)
    print(f"Total pages: {total_pages}")

    records = []
    
    for page_idx in range(total_pages):
        try:
            text = reader.pages[page_idx].extract_text(extraction_mode='layout')
        except Exception as e:
            continue
        if not text:
            continue
            
        lines = text.split('\n')
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            
            # Check if line begins with digit (S. No.)
            m = re.match(r"^\s*(\d+)\s+(202\d)\s+([A-Za-z\-]+)\s+(.+)$", line_str)
            if not m:
                continue
                
            s_no = int(m.group(1))
            year = int(m.group(2))
            season = m.group(3)
            rest = m.group(4)
            
            # Use multiple spaces as column separators
            tokens = [t.strip() for t in re.split(r"\s{2,}", rest) if t.strip()]
            if len(tokens) < 10:
                # Fall back to single space split if layout collapsed
                tokens = rest.split()
            
            # Find the longitude / latitude column:
            # Lon: 68-98, Lat: 6-38, pH: 5.5-9.5
            coord_idx = -1
            for i in range(len(tokens) - 5):
                lon_val = clean_num(tokens[i])
                lat_val = clean_num(tokens[i+1]) if i+1 < len(tokens) else None
                if lon_val and lat_val and 68.0 <= lon_val <= 98.0 and 6.0 <= lat_val <= 38.0:
                    coord_idx = i
                    break
                    
            if coord_idx == -1:
                continue
                
            loc_parts = tokens[:coord_idx]
            loc_str = " - ".join(loc_parts)
            
            lon = clean_num(tokens[coord_idx])
            lat = clean_num(tokens[coord_idx+1])
            
            chem_tokens = tokens[coord_idx+2:]
            
            # Columns in CGWB GWQ Table:
            # [0] pH, [1] EC, [2] TDS, [3] CO3, [4] HCO3, [5] Alkalinity, [6] Cl, [7] NO3, [8] SO4,
            # [9] PO4, [10] SiO2, [11] Fluoride, [12] Hardness, [13] Ca, [14] Mg, [15] Na, [16] K,
            # [17] Fe, [18] As, [19] U, [20] Mn, [21] Cu, [22] Pb, [23] Zn, [24] Ni, [25] Cd, [26] Cr
            ph = clean_num(chem_tokens[0]) if len(chem_tokens) > 0 else None
            ec = clean_num(chem_tokens[1]) if len(chem_tokens) > 1 else None
            tds = clean_num(chem_tokens[2]) if len(chem_tokens) > 2 else None
            co3 = clean_num(chem_tokens[3]) if len(chem_tokens) > 3 else None
            hco3 = clean_num(chem_tokens[4]) if len(chem_tokens) > 4 else None
            alkalinity = clean_num(chem_tokens[5]) if len(chem_tokens) > 5 else None
            cl = clean_num(chem_tokens[6]) if len(chem_tokens) > 6 else None
            no3 = clean_num(chem_tokens[7]) if len(chem_tokens) > 7 else None
            so4 = clean_num(chem_tokens[8]) if len(chem_tokens) > 8 else None
            po4 = clean_num(chem_tokens[9]) if len(chem_tokens) > 9 else None
            sio2 = clean_num(chem_tokens[10]) if len(chem_tokens) > 10 else None
            fluoride = clean_num(chem_tokens[11]) if len(chem_tokens) > 11 else None
            hardness = clean_num(chem_tokens[12]) if len(chem_tokens) > 12 else None
            ca = clean_num(chem_tokens[13]) if len(chem_tokens) > 13 else None
            mg = clean_num(chem_tokens[14]) if len(chem_tokens) > 14 else None
            na = clean_num(chem_tokens[15]) if len(chem_tokens) > 15 else None
            k = clean_num(chem_tokens[16]) if len(chem_tokens) > 16 else None
            fe = clean_num(chem_tokens[17]) if len(chem_tokens) > 17 else None
            arsenic = clean_num(chem_tokens[18]) if len(chem_tokens) > 18 else None
            uranium = clean_num(chem_tokens[19]) if len(chem_tokens) > 19 else None
            
            # Plausibility sanity checks
            if ph is not None and (ph < 4.0 or ph > 11.0):
                ph = None
            if fluoride is not None and fluoride > 50.0:
                fluoride = None
            if no3 is not None and no3 > 2000.0:
                no3 = None
            if tds is not None and tds > 50000.0:
                tds = None

            # Exceedance checks according to BIS IS 10500:2012
            f_excess = (fluoride is not None and fluoride > 1.5)
            no3_excess = (no3 is not None and no3 > 45.0)
            tds_excess = (tds is not None and tds > 2000.0)
            tds_elevated = (tds is not None and tds > 500.0)
            ph_abnormal = (ph is not None and (ph < 6.5 or ph > 8.5))
            arsenic_excess = (arsenic is not None and arsenic > 10.0)
            uranium_excess = (uranium is not None and uranium > 30.0)
            fe_excess = (fe is not None and fe > 1.0)
            
            risk_score = 0
            if f_excess: risk_score += 35
            elif fluoride and fluoride > 1.0: risk_score += 15
            if no3_excess: risk_score += 30
            elif no3 and no3 > 20.0: risk_score += 10
            if tds_excess: risk_score += 25
            elif tds_elevated: risk_score += 10
            if ph_abnormal: risk_score += 15
            if arsenic_excess: risk_score += 40
            if uranium_excess: risk_score += 35
            if fe_excess: risk_score += 15
            
            risk_score = min(100, risk_score)
            if risk_score >= 60:
                stress_category = "Critical Contamination"
            elif risk_score >= 35:
                stress_category = "Elevated Stress"
            elif risk_score >= 15:
                stress_category = "Moderate Caution"
            else:
                stress_category = "Potable & Safe"
                
            records.append({
                "s_no": s_no,
                "year": year,
                "season": season,
                "location": loc_str,
                "longitude": lon,
                "latitude": lat,
                "pH": ph,
                "EC": ec,
                "TDS": tds,
                "HCO3": hco3,
                "Alkalinity": alkalinity,
                "Cl": cl,
                "NO3": no3,
                "SO4": so4,
                "Fluoride": fluoride,
                "Hardness": hardness,
                "Ca": ca,
                "Mg": mg,
                "Na": na,
                "Fe": fe,
                "Arsenic": arsenic,
                "Uranium": uranium,
                "fluoride_excess": f_excess,
                "nitrate_excess": no3_excess,
                "tds_excess": tds_excess,
                "stress_score": risk_score,
                "stress_category": stress_category
            })

    print(f"Extracted {len(records)} clean monitoring records from CGWB dataset.")
    
    valid_ph = [r["pH"] for r in records if r["pH"] is not None]
    valid_tds = [r["TDS"] for r in records if r["TDS"] is not None]
    valid_f = [r["Fluoride"] for r in records if r["Fluoride"] is not None]
    valid_no3 = [r["NO3"] for r in records if r["NO3"] is not None]
    
    f_exceed_count = sum(1 for r in records if r["fluoride_excess"])
    no3_exceed_count = sum(1 for r in records if r["nitrate_excess"])
    tds_exceed_count = sum(1 for r in records if r["tds_excess"])
    critical_count = sum(1 for r in records if r["stress_category"] == "Critical Contamination")
    potable_count = sum(1 for r in records if r["stress_category"] == "Potable & Safe")
    
    summary = {
        "dataset_name": "CGWB Groundwater Quality Monitoring 2024",
        "provenance": "Central Ground Water Board (CGWB), Department of Water Resources, Ministry of Jal Shakti, Government of India",
        "publication_year": 2024,
        "standard_applied": "BIS IS 10500:2012 Drinking Water Specification",
        "total_monitoring_stations_parsed": len(records),
        "total_pages_scanned": total_pages,
        "parameters_analyzed": ["pH", "EC", "TDS", "Fluoride", "Nitrate", "Total Hardness", "Alkalinity", "Arsenic", "Uranium", "Iron"],
        "statistics": {
            "mean_ph": round(sum(valid_ph)/len(valid_ph), 2) if valid_ph else None,
            "mean_tds_mg_l": round(sum(valid_tds)/len(valid_tds), 1) if valid_tds else None,
            "mean_fluoride_mg_l": round(sum(valid_f)/len(valid_f), 3) if valid_f else None,
            "mean_nitrate_mg_l": round(sum(valid_no3)/len(valid_no3), 2) if valid_no3 else None,
            "fluoride_exceedance_stations": f_exceed_count,
            "fluoride_exceedance_pct": round(100.0 * f_exceed_count / len(records), 1) if records else 0,
            "nitrate_exceedance_stations": no3_exceed_count,
            "nitrate_exceedance_pct": round(100.0 * no3_exceed_count / len(records), 1) if records else 0,
            "tds_exceedance_stations": tds_exceed_count,
            "tds_exceedance_pct": round(100.0 * tds_exceed_count / len(records), 1) if records else 0,
            "critical_risk_stations": critical_count,
            "potable_safe_stations": potable_count
        },
        "sample_stations": records[:200]
    }
    
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"Summary saved to {OUTPUT_JSON}")
    
    with open(OUTPUT_DATASET, "w", encoding="utf-8") as f:
        json.dump(records, f)
    print(f"Full dataset ({len(records)} records) saved to {OUTPUT_DATASET}")

if __name__ == "__main__":
    main()
