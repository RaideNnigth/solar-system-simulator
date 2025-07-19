import re

input_file = "mars_ephemeris.csv"
output_file = "mars_ephemeris_clean.csv"

# Read all lines
with open(input_file, "r", encoding="utf-8") as f:
    lines = f.readlines()

cleaned_lines = []
for line in lines:
    # Replace any whitespace that is between non-whitespace characters with a comma
    # This regex finds whitespace that has a non-whitespace before and after
    cleaned_line = re.sub(r'(?<=\S)\s+(?=\S)', ',', line.rstrip())
    cleaned_lines.append(cleaned_line)

# Write output
with open(output_file, "w", encoding="utf-8") as f:
    for line in cleaned_lines:
        f.write(line + "\n")

print("Done! Cleaned file saved as:", output_file)
