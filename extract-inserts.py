import re

# Read the SQL dump
with open('newyear (3).sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract all INSERT statements
# Pattern matches INSERT INTO ... VALUES (...);
insert_pattern = r'INSERT INTO[^;]+;'
inserts = re.findall(insert_pattern, content, re.DOTALL | re.MULTILINE)

# Tables to skip (have parsing issues or are non-critical)
skip_tables = ['admin_login_logs']

# Write to new file with INSERT IGNORE to skip duplicates
with open('seed-data-only.sql', 'w', encoding='utf-8') as f:
    f.write('-- Data-only seed file (INSERT IGNORE to skip duplicates)\n')
    f.write('-- Generated from newyear (3).sql\n\n')
    skipped = 0
    for insert in inserts:
        # Check if this insert is for a table we should skip
        should_skip = False
        for table in skip_tables:
            if f'`{table}`' in insert:
                should_skip = True
                skipped += 1
                break
        
        if should_skip:
            continue
            
        # Replace INSERT INTO with INSERT IGNORE INTO
        safe_insert = insert.replace('INSERT INTO', 'INSERT IGNORE INTO')
        f.write(safe_insert + '\n\n')

print(f'✅ Extracted {len(inserts) - skipped} INSERT IGNORE statements')
print(f'⏭️  Skipped {skipped} statements (tables: {skip_tables})')
print(f'📄 Output file: seed-data-only.sql')
