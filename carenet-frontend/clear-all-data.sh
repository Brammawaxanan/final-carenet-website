#!/bin/bash

echo "🗑️  Clearing all demo data to reload with enhanced data..."
echo ""

# Clear all tables in correct order (respecting foreign keys)
mysql -u root -pBramma@3681 CareNet << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM payment_ledgers;
DELETE FROM task_proofs;
DELETE FROM tasks;
DELETE FROM assignments;
DELETE FROM subscription;
DELETE FROM caregivers;
DELETE FROM users;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'All data cleared successfully!' as result;
EOF

if [ $? -eq 0 ]; then
    echo "✅ All data cleared successfully!"
    echo ""
    echo "Now restart the backend to load enhanced demo data:"
    echo "1. Stop backend (Ctrl+C)"
    echo "2. Run: mvn spring-boot:run"
    echo "3. New data will be loaded with:"
    echo "   - 5 tasks with different statuses"
    echo "   - 3 payment ledger entries"
    echo "   - Realistic dashboard statistics"
    echo ""
else
    echo "❌ Error clearing data"
    echo "Make sure MySQL is running and password is correct"
fi
