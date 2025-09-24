import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM || "+1234567890";

// Check if we have valid Twilio credentials
const hasTwilioCredentials = accountSid && authToken && accountSid.startsWith('AC');

// Initialize client only if we have valid credentials
let client: any = null;
if (hasTwilioCredentials) {
  client = twilio(accountSid, authToken);
}

export interface SMSReminder {
  to: string;
  message: string;
  scheduledTime?: Date;
}

export interface CallReminder {
  to: string;
  message: string;
  scheduledTime?: Date;
}

export async function sendSMSReminder(reminder: SMSReminder): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  // Return mock success if Twilio is not configured (for demo purposes)
  if (!hasTwilioCredentials || !client) {
    console.log("Twilio not configured - SMS reminder (demo):", reminder.message);
    return {
      success: true,
      messageId: `demo_${Date.now()}`,
    };
  }

  try {
    const message = await client.messages.create({
      body: reminder.message,
      from: fromNumber,
      to: reminder.to,
    });

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error) {
    console.error("Twilio SMS error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function scheduleVoiceCall(reminder: CallReminder): Promise<{
  success: boolean;
  callId?: string;
  error?: string;
}> {
  // Return mock success if Twilio is not configured (for demo purposes)
  if (!hasTwilioCredentials || !client) {
    console.log("Twilio not configured - Voice call reminder (demo):", reminder.message);
    return {
      success: true,
      callId: `demo_call_${Date.now()}`,
    };
  }

  try {
    const call = await client.calls.create({
      twiml: `<Response><Say voice="alice" language="en-IN">${reminder.message}</Say></Response>`,
      from: fromNumber,
      to: reminder.to,
    });

    return {
      success: true,
      callId: call.sid,
    };
  } catch (error) {
    console.error("Twilio Call error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function generateMedicineReminderMessage(
  patientName: string,
  medicineName: string,
  dosage: string,
  language: string = "en"
): string {
  if (language === "hi") {
    return `नमस्ते ${patientName}, यह आपकी दवा ${medicineName} (${dosage}) लेने का समय है। कृपया अपनी दवा लें और MediCare Plus ऐप में "लिया गया" पर क्लिक करें।`;
  }
  
  return `Hello ${patientName}, it's time to take your medication ${medicineName} (${dosage}). Please take your medicine and mark it as "taken" in the MediCare Plus app.`;
}

export function generateUrgentReminderMessage(
  patientName: string,
  medicineName: string,
  hoursOverdue: number,
  language: string = "en"
): string {
  if (language === "hi") {
    return `${patientName}, आप अपनी दवा ${medicineName} लेना भूल गए हैं। यह ${hoursOverdue} घंटे से देर हो चुकी है। कृपया तुरंत दवा लें या डॉक्टर से संपर्क करें।`;
  }
  
  return `${patientName}, you missed your ${medicineName} medication which was due ${hoursOverdue} hours ago. Please take it now or contact your doctor immediately.`;
}

export async function sendBulkReminders(reminders: SMSReminder[]): Promise<{
  successful: number;
  failed: number;
  results: Array<{ to: string; success: boolean; messageId?: string; error?: string }>;
}> {
  const results = await Promise.all(
    reminders.map(async (reminder) => {
      const result = await sendSMSReminder(reminder);
      return {
        to: reminder.to,
        ...result,
      };
    })
  );

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    successful,
    failed,
    results,
  };
}
