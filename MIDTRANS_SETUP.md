# Midtrans Snap Integration Setup Guide

This guide will help you set up Midtrans Snap payment gateway integration for membership purchases.

## Prerequisites

1. Midtrans account (Sign up at https://midtrans.com)
2. Midtrans Merchant ID, Server Key, and Client Key

## Environment Variables

Add the following variables to your `.env` file:

```bash
# Midtrans Server Key (Secret Key)
# Get from: https://dashboard.midtrans.com/settings/config_info
MIDTRANS_SERVER_KEY=your_server_key_here

# Midtrans Client Key
# Get from: https://dashboard.midtrans.com/settings/config_info
MIDTRANS_CLIENT_KEY=your_client_key_here

# Midtrans Merchant ID
MIDTRANS_MERCHANT_ID=your_merchant_id_here

# Environment Mode
# Set to "true" for production, "false" for sandbox/testing
MIDTRANS_IS_PRODUCTION=false

# Public Client Key (for frontend)
# Same as MIDTRANS_CLIENT_KEY but prefixed with NEXT_PUBLIC for frontend access
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_client_key_here
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false

# Application URL
# Used for webhook callbacks and redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Midtrans Credentials

### Sandbox (Testing) Environment

1. Login to Midtrans Dashboard: https://dashboard.sandbox.midtrans.com
2. Go to **Settings** → **Access Keys**
3. Copy your:
   - Server Key
   - Client Key
   - Merchant ID

### Production Environment

1. Login to Midtrans Dashboard: https://dashboard.midtrans.com
2. Complete merchant verification
3. Go to **Settings** → **Access Keys**
4. Copy your production credentials
5. Set `MIDTRANS_IS_PRODUCTION=true` in your `.env`

## Webhook Configuration

### Register Webhook URL in Midtrans Dashboard

1. Login to Midtrans Dashboard
2. Go to **Settings** → **Configuration**
3. Set **Payment Notification URL** to:
   ```
   https://yourdomain.com/api/midtrans/webhook
   ```
4. Enable all notification types:
   - Payment Success
   - Payment Pending
   - Payment Failed
   - Payment Expired

### Testing Webhook Locally

Use ngrok or similar tools to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000

# Use the ngrok URL in Midtrans dashboard
# Example: https://abc123.ngrok.io/api/midtrans/webhook
```

## Features Implemented

### 1. Purchase Flow

- User clicks "Purchase Now" on a membership product
- System creates transaction and membership with PENDING status
- Midtrans Snap token is generated
- Snap payment popup opens automatically
- User completes payment in the popup

### 2. Reopen Pending Payments

- Users can view pending transactions in "My Account"
- "Continue Payment" button appears for PENDING transactions
- Clicking the button reopens the Snap payment popup
- Snap tokens are cached for 24 hours (Midtrans token expiry)

### 3. Webhook Handler

- Receives payment notifications from Midtrans
- Verifies signature using SHA512 hash
- Validates transaction status with Midtrans API
- Updates transaction and membership status
- Sends email notifications on successful payment

### 4. Security Features

- Signature verification on all webhook calls
- Transaction status verification with Midtrans API
- Idempotency handling for duplicate webhooks
- Server Key never exposed to frontend
- HTTPS required in production

## Payment Flow Diagram

```
User → Click Purchase → Create Transaction (PENDING)
                     → Create Membership (PENDING)
                     → Generate Snap Token
                     → Open Snap Popup
                     → Complete Payment

Midtrans → Send Webhook → Verify Signature
                        → Verify Status with API
                        → Update Transaction (COMPLETED)
                        → Update Membership (ACTIVE)
                        → Send Email Notification
```

## Transaction Status Mapping

| Midtrans Status        | Internal Status | Membership Action |
| ---------------------- | --------------- | ----------------- |
| capture, settlement    | COMPLETED       | Activate          |
| pending                | PENDING         | No change         |
| deny                   | FAILED          | Suspend           |
| cancel                 | CANCELLED       | Suspend           |
| expire                 | EXPIRED         | Suspend           |
| refund, partial_refund | REFUNDED        | Suspend           |

## Testing

### Test Cards (Sandbox Only)

| Card Number         | 3D Secure | Result           |
| ------------------- | --------- | ---------------- |
| 4811 1111 1111 1114 | Yes       | Success          |
| 4911 1111 1111 1113 | Yes       | Challenge by FDS |
| 4411 1111 1111 1118 | No        | Success          |

CVV: Any 3 digits  
Expiry: Any future date  
OTP: 112233

### Test Scenarios

1. **Successful Payment**
   - Create purchase
   - Complete payment with test card
   - Verify membership is ACTIVE
   - Check email notification

2. **Pending Payment**
   - Create purchase
   - Close Snap popup without paying
   - Verify transaction is PENDING
   - Use "Continue Payment" button
   - Complete payment

3. **Failed Payment**
   - Create purchase
   - Use test card that fails
   - Verify transaction is FAILED
   - Verify membership is SUSPENDED

4. **Webhook Verification**
   - Trigger webhook manually
   - Check signature verification
   - Verify status update
   - Check logs

## Troubleshooting

### Snap Popup Not Opening

- Check browser console for errors
- Verify `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` is set
- Ensure Snap.js is loaded (check Network tab)
- Check for CORS issues

### Webhook Not Received

- Verify webhook URL is correct in Midtrans dashboard
- Check webhook URL is publicly accessible (not localhost)
- Review server logs for errors
- Test webhook with Postman

### Payment Success but Membership Not Activated

- Check webhook logs
- Verify signature verification passed
- Check transaction status in database
- Review email logs

### Invalid Signature Error

- Verify `MIDTRANS_SERVER_KEY` is correct
- Check notification payload format
- Review signature calculation logic

## Production Checklist

- [ ] Switch to production credentials
- [ ] Set `MIDTRANS_IS_PRODUCTION=true`
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Register production webhook URL in Midtrans dashboard
- [ ] Test end-to-end flow with real payment method
- [ ] Enable HTTPS
- [ ] Monitor webhook logs
- [ ] Set up error alerting
- [ ] Test email notifications
- [ ] Review security settings

## Support

- Midtrans Documentation: https://docs.midtrans.com
- Midtrans Dashboard: https://dashboard.midtrans.com
- API Reference: https://api-docs.midtrans.com

## Security Notes

1. **Never commit** `.env` files to version control
2. **Never expose** `MIDTRANS_SERVER_KEY` to frontend
3. **Always verify** webhook signatures
4. **Always validate** transaction status with Midtrans API
5. **Use HTTPS** in production
6. **Rotate keys** regularly
7. **Monitor** webhook logs for suspicious activity
