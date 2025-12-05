import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VAPID public key (matches the one in frontend)
const VAPID_PUBLIC_KEY = 'BJwH33Ca0A2Wmsupybxpadhc9hriqzi9UGcgQU_1ShK2Mkqsnz-XCW2R1LDcIgXUTB4IH5LwO4LgRMCdiSHrBNk';

// Helper function to convert base64url to Uint8Array
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - base64Url.length % 4) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper function to convert Uint8Array to base64url
function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...uint8Array));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Create JWT for VAPID authentication
async function createVapidJwt(audience: string, subject: string, privateKeyBase64: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const headerB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKeyBytes = base64UrlToUint8Array(privateKeyBase64);
  const key = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signature));
  return `${unsignedToken}.${signatureB64}`;
}

// Send push notification using Web Push Protocol
async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<void> {
  const endpoint = new URL(subscription.endpoint);
  const audience = `${endpoint.protocol}//${endpoint.host}`;

  // Create VAPID JWT
  const jwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKey);

  // Encrypt the payload using the subscription keys
  const p256dhKey = base64UrlToUint8Array(subscription.keys.p256dh);
  const authKey = base64UrlToUint8Array(subscription.keys.auth);

  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Import subscriber's public key
  const subscriberPublicKey = await crypto.subtle.importKey(
    'raw',
    p256dhKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );

  // Export local public key
  const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKeyBytes = new Uint8Array(localPublicKeyRaw);

  // Derive encryption key using HKDF
  const sharedSecretKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  // Create info for HKDF
  const encoder = new TextEncoder();
  const keyInfo = new Uint8Array([
    ...encoder.encode('WebPush: info\0'),
    ...p256dhKey,
    ...localPublicKeyBytes,
  ]);

  const authInfo = encoder.encode('Content-Encoding: auth\0');
  const aesgcmInfo = new Uint8Array([
    ...encoder.encode('Content-Encoding: aesgcm\0'),
    0, 65, ...localPublicKeyBytes,
    0, 65, ...p256dhKey,
  ]);
  const nonceInfo = new Uint8Array([
    ...encoder.encode('Content-Encoding: nonce\0'),
    0, 65, ...localPublicKeyBytes,
    0, 65, ...p256dhKey,
  ]);

  // Import auth secret
  const authSecretKey = await crypto.subtle.importKey(
    'raw',
    authKey,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  // Derive PRK (Pseudo-Random Key)
  const prk = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: authKey, info: keyInfo },
    sharedSecretKey,
    256
  );

  const prkKey = await crypto.subtle.importKey(
    'raw',
    prk,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  // Derive content encryption key
  const cekBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: encoder.encode('Content-Encoding: aes128gcm\0') },
    prkKey,
    128
  );

  // Derive nonce
  const nonceBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: encoder.encode('Content-Encoding: nonce\0') },
    prkKey,
    96
  );

  // Import CEK for AES-GCM
  const cek = await crypto.subtle.importKey(
    'raw',
    cekBits,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Pad and encrypt the payload
  const payloadBytes = encoder.encode(payload);
  const paddedPayload = new Uint8Array(payloadBytes.length + 2);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 2; // Delimiter

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonceBits, tagLength: 128 },
    cek,
    paddedPayload
  );

  // Build the encrypted content
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096, false);

  const body = new Uint8Array([
    ...salt,
    ...recordSize,
    localPublicKeyBytes.length,
    ...localPublicKeyBytes,
    ...new Uint8Array(encrypted),
  ]);

  // Send the request
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Urgency': 'normal',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Push failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const vapidSubject = Deno.env.get('VAPID_SUBJECT')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current time info
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay() === 0 ? 7 : now.getDay();

    console.log(`Checking reminders at ${currentHour}:${currentMinute} on day ${currentDay}`);

    // Get all users who should receive reminders
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('user_id, reminder_time, reminder_days, push_subscription')
      .eq('chore_reminders_enabled', true)
      .eq('push_enabled', true);

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError);
      throw prefsError;
    }

    console.log(`Found ${preferences?.length || 0} users with notifications enabled`);

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const pref of preferences || []) {
      try {
        // Check if today is in the user's reminder days
        if (!pref.reminder_days || !pref.reminder_days.includes(currentDay)) {
          skippedCount++;
          continue;
        }

        // Parse reminder time (format: HH:MM:SS or HH:MM)
        const [reminderHour, reminderMinute] = pref.reminder_time.split(':').map(Number);
        
        // Check if it's within 15 minutes of reminder time (since cron runs every 15 min)
        const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (reminderHour * 60 + reminderMinute));
        if (timeDiff > 15) {
          skippedCount++;
          continue;
        }

        // Get user's incomplete chores
        const { data: chores, error: choresError } = await supabase
          .from('chores')
          .select('id, title')
          .eq('user_id', pref.user_id)
          .eq('completed', false);

        if (choresError) {
          console.error(`Error fetching chores for user ${pref.user_id}:`, choresError);
          errorCount++;
          continue;
        }

        const choreCount = chores?.length || 0;
        
        // Only send notification if there are incomplete chores
        if (choreCount === 0) {
          console.log(`User ${pref.user_id} has no incomplete chores, skipping`);
          skippedCount++;
          continue;
        }

        // Send push notification via Web Push Protocol
        if (pref.push_subscription?.endpoint && pref.push_subscription?.keys) {
          const notificationPayload = {
            title: '⏰ Chore Reminder!',
            body: `You have ${choreCount} incomplete chore${choreCount > 1 ? 's' : ''}. Time to earn those coins! 💰`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: {
              url: '/chores'
            }
          };

          try {
            await sendPushNotification(
              pref.push_subscription,
              JSON.stringify(notificationPayload),
              vapidPrivateKey,
              vapidSubject
            );
            console.log(`✅ Successfully sent push to user ${pref.user_id}`);
            sentCount++;
          } catch (pushError) {
            console.error(`❌ Failed to send push to user ${pref.user_id}:`, pushError);
            errorCount++;
          }
        } else {
          console.log(`User ${pref.user_id} has no valid push subscription (missing endpoint or keys)`);
          skippedCount++;
        }
      } catch (userError) {
        console.error(`Error processing user ${pref.user_id}:`, userError);
        errorCount++;
      }
    }

    const result = {
      success: true,
      message: `Processed ${preferences?.length || 0} users`,
      sent: sentCount,
      skipped: skippedCount,
      errors: errorCount,
      time: `${currentHour}:${currentMinute}`,
      day: currentDay
    };

    console.log('Result:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
