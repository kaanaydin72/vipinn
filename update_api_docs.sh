#!/bin/bash

# Update API documentation file
FILE="client/src/components/admin/api-documentation.tsx"

# Replace all instances of elitehotels.com with vipinnhotels.com
sed -i 's/elitehotels\.com/vipinnhotels.com/g' "$FILE"

# Replace Elite Hotel with Vipinn Hotel
sed -i 's/Elite Hotel/Vipinn Hotel/g' "$FILE"

# Replace Elite Hotels with Vipinn Hotels
sed -i 's/Elite Hotels/Vipinn Hotels/g' "$FILE"

# Replace ELT- reservation code with VIP-
sed -i 's/ELT-/VIP-/g' "$FILE"

# Replace email domain
sed -i 's/api@elitehotels\.com/api@vipinnhotels.com/g' "$FILE"

echo "API documentation updated successfully."
