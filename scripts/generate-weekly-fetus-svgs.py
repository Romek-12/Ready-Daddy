#!/usr/bin/env python3
import os
import glob

# Paths
svg_dir = "fetus_weekly_realistic_svgs"
output_file = "mobile/src/data/fetusSvgs.ts"

# Read all SVG files
svg_files = sorted(glob.glob(os.path.join(svg_dir, "fetus_week_*.svg")))

# Generate TypeScript file
with open(output_file, 'w', encoding='utf-8') as f:
    f.write("// Auto-generated from fetus_weekly_realistic_svgs/\n")
    f.write("// Run: python3 scripts/generate-weekly-fetus-svgs.py\n\n")
    f.write("const FETUS_SVGS: Record<number, string> = {\n")
    
    for svg_file in svg_files:
        # Extract week number from filename (e.g., fetus_week_01.svg -> 1)
        filename = os.path.basename(svg_file)
        week_num = int(filename.replace("fetus_week_", "").replace(".svg", ""))
        
        # Read SVG content
        with open(svg_file, 'r', encoding='utf-8') as svg:
            svg_content = svg.read()
        
        # Escape backticks and backslashes for JavaScript template literal
        svg_content = svg_content.replace('\', '\\').replace('`', '\`')
        
        # Write to output
        f.write(f"  {week_num}: `{svg_content}`,\n")
    
    f.write("};\n\n")
    f.write("export default FETUS_SVGS;\n")

print(f"Generated {output_file} with {len(svg_files)} week SVGs")
