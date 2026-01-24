# Midtrans Integration Refactoring

## Overview
Complete refactoring of the Midtrans payment integration to follow best practices, improve maintainability, and reduce code duplication.

## Changes Made

### 1. **New Files Created**

#### `src/lib/midtrans/constants.ts`
- Centralized all magic values and string literals
- Exported typed constants for transaction and membership statuses
- Defined token expiry time (24 hours)
- Array of suspended transaction statuses for easier maintenance

#### `src/lib/midtrans/utils.ts`
- **`createAuthHeader()`** - DRY up Basic Auth header creation
- **`midtransFetch()`** - Unified fetch wrapper with auth
- **`parseJsonResponse()`** - Safe JSON parsing with better error handling
- **`serializeForPrisma()`** - Type-safe JSON serialization for Prisma fields

#### `src/lib/midtrans/webhook-service.ts`
- **`verifyWebhook()`** - Signature + API verification in one function
- **`updateTransaction()`** - Centralized transaction update logic
- **`updateMembershipStatus()`** - Smart membership status handling
- **`sendPaymentSuccessEmail()`** - Email sending with proper error handling
- **`activateMemberships()`** - Helper for COMPLETED status
- **`suspendMemberships()`** - Helper for failed/cancelled/expired/refunded

#### `src/lib/midtrans/index.ts`
- Clean barrel export for all Midtrans functionality
- Single import point: `import { ... } from '@/lib/midtrans'`

### 2. **Enhanced Types**

#### `src/lib/midtrans/types.ts`
Added proper types for transaction metadata:
- `TransactionMetadata` - Complete metadata structure
- `SnapTokenMetadata` - Snap token specific metadata

### 3. **Refactored Files**

#### `src/lib/midtrans/config.ts`
- Separated `snapApiUrl` (app.midtrans.com) from `coreApiUrl` (api.midtrans.com)
- **Fixed:** Transaction status checks were using wrong endpoint

#### `src/lib/midtrans/snap.ts`
**Before:** Duplicate auth code, verbose error handling
**After:**
- Uses `midtransFetch()` and `parseJsonResponse()` helpers
- Uses constants instead of magic strings
- Cleaner `mapMidtransStatus()` with object map instead of switch
- Better error messages with response preview

#### `src/app/api/midtrans/webhook/route.ts`
**Before:** 193 lines of nested logic
**After:** 70 lines using service layer
- Removed duplicate membership suspension logic
- Used service functions for all business logic
- Better separation of concerns
- Improved error handling with specific error types

#### `src/app/api/transactions/[id]/snap-token/route.ts`
**Before:** Magic numbers, inline logic
**After:**
- Uses `SNAP_TOKEN_EXPIRY_MS` constant
- Uses `TRANSACTION_STATUS` constants
- Proper `TransactionMetadata` typing
- Extracted `getValidSnapToken()` helper function

#### `src/app/api/public/purchase/route.ts`
- Uses constants instead of string literals
- Proper `TransactionMetadata` typing
- Consistent with other routes

## Benefits

### 1. **Code Quality**
- ✅ No magic numbers or string literals
- ✅ Single Responsibility Principle - each function has one job
- ✅ DRY - no code duplication
- ✅ Type safety with proper interfaces

### 2. **Maintainability**
- ✅ Easy to update status values in one place
- ✅ Clear function names describe intent
- ✅ Separated business logic from API routes
- ✅ Testable service layer

### 3. **Error Handling**
- ✅ Specific error types (InvalidSignatureError, MidtransAPIError)
- ✅ Better error messages with context
- ✅ Safe JSON parsing with fallbacks
- ✅ Email failures don't break webhooks

### 4. **Performance**
- ✅ Fixed API endpoint (was causing JSON parse errors)
- ✅ Reuses snap tokens when valid
- ✅ Idempotent webhook handling

### 5. **Developer Experience**
- ✅ Single import point: `@/lib/midtrans`
- ✅ Clear documentation in JSDoc comments
- ✅ Consistent patterns across all routes
- ✅ Easy to extend with new features

## Migration Guide

### Old Import Pattern
```typescript
import { createSnapTransaction } from "@/lib/midtrans/snap";
import { InvalidSignatureError } from "@/lib/midtrans/errors";
```

### New Import Pattern
```typescript
import { createSnapTransaction, InvalidSignatureError } from "@/lib/midtrans";
```

### Using Constants
```typescript
// Old
if (transaction.status === "PENDING") { ... }
if (membership.status === "ACTIVE") { ... }

// New
import { TRANSACTION_STATUS, MEMBERSHIP_STATUS } from "@/lib/midtrans";

if (transaction.status === TRANSACTION_STATUS.PENDING) { ... }
if (membership.status === MEMBERSHIP_STATUS.ACTIVE) { ... }
```

### Using Service Layer
```typescript
// Old - in webhook route
const transactionStatus = await getTransactionStatus(orderId);
const newStatus = mapMidtransStatus(transactionStatus.transaction_status);
// ... update transaction
// ... update memberships
// ... send email

// New
import { verifyWebhook, updateTransaction, updateMembershipStatus } from "@/lib/midtrans";

const newStatus = await verifyWebhook(notification);
await updateTransaction(transactionId, newStatus, notification, metadata);
await updateMembershipStatus(transactionId, newStatus);
```

## Testing Checklist

- [x] Webhook signature verification
- [x] Transaction status updates
- [x] Membership activation on payment
- [x] Membership suspension on failure
- [x] Email notifications
- [x] Snap token generation
- [x] Snap token reuse
- [x] Purchase flow
- [x] Lint checks passed
- [x] No type errors

## Future Improvements

1. **Unit Tests** - Add tests for service layer functions
2. **Webhook Retry Logic** - Handle transient failures
3. **Monitoring** - Add metrics for payment success rates
4. **Logging** - Structured logging with trace IDs
5. **Rate Limiting** - Protect webhook endpoint
6. **Webhook Signature Cache** - Cache verified webhooks
