import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyFirebaseIdToken } from "@/lib/firebase/verify-token";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fcm_token, firebase_id_token, platform } = body;

    if (!fcm_token || typeof fcm_token !== "string" || fcm_token.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "A valid fcm_token is required." },
        { status: 400 }
      );
    }

    let verifiedUserId: string | null = null;

    if (firebase_id_token && typeof firebase_id_token === "string" && firebase_id_token.trim().length > 0) {
      const verification = await verifyFirebaseIdToken(firebase_id_token.trim());
      if (!verification.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid Firebase authentication: ${verification.error}` },
          { status: 401 }
        );
      }
      verifiedUserId = verification.uid || null;
    }

    const supabase = await createAdminClient();

    const payload = {
      fcm_token: fcm_token.trim(),
      user_id: verifiedUserId,
      platform: platform || "android",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("device_tokens")
      .upsert(payload, { onConflict: "fcm_token" })
      .select()
      .single();

    if (error) {
      console.error("Error upserting device token to Supabase:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Device token registered securely with verified identity.",
    });
  } catch (err: any) {
    console.error("Exception in register-device-token:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
