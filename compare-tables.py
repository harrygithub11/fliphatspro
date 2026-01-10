import re

# Read SQL dump
with open('newyear (3).sql', 'r', encoding='utf-8') as f:
    sql_content = f.read()

# Read Prisma schema
with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    prisma_content = f.read()

# Extract tables from SQL dump
sql_tables = set(re.findall(r'CREATE TABLE `([^`]+)`', sql_content))

# Extract tables from Prisma schema (@@map entries)
prisma_tables = set(re.findall(r'@@map\("([^"]+)"\)', prisma_content))

# Write to file
with open('table-comparison.txt', 'w', encoding='utf-8') as f:
    f.write("TABLES IN SQL DUMP:\n")
    for t in sorted(sql_tables):
        status = "OK" if t in prisma_tables else "MISSING"
        f.write(f"  [{status}] {t}\n")

    f.write("\nMISSING TABLES (in SQL dump but NOT in Prisma schema):\n")
    missing = sql_tables - prisma_tables
    for t in sorted(missing):
        f.write(f"  - {t}\n")

    f.write("\nEXTRA TABLES (in Prisma schema but NOT in SQL dump):\n")
    extra = prisma_tables - sql_tables
    for t in sorted(extra):
        f.write(f"  - {t}\n")

    f.write(f"\nSummary: {len(sql_tables)} tables in SQL dump, {len(prisma_tables)} in Prisma\n")
    f.write(f"Missing: {len(missing)}, Extra: {len(extra)}\n")

print("Done! Check table-comparison.txt")
