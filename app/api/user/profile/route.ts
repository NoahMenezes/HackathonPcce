import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/user/profile - Get user profile and settings
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select(
        `
        *,
        users!inner(name, email, avatar)
      `,
      )
      .eq("user_id", user.userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      // PGRST116 = not found
      throw profileError;
    }

    // If profile doesn't exist, create default profile
    if (!profile) {
      const { data: newProfile, error: insertError } = await supabase
        .from("user_profiles")
        .insert({ user_id: user.userId })
        .select(
          `
          *,
          users!inner(name, email, avatar)
        `,
        )
        .single();

      if (insertError) {
        throw insertError;
      }

      return NextResponse.json({
        success: true,
        data: {
          ...newProfile,
          full_name: newProfile.users.name,
          email: newProfile.users.email,
          avatar: newProfile.users.avatar,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        full_name: profile.users.name,
        email: profile.users.email,
        avatar: profile.users.avatar,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch profile",
      },
      { status: 500 },
    );
  }
}

// PUT /api/user/profile - Update user profile and settings
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      full_name,
      phone,
      address,
      city,
      state,
      pincode,
      bio,
      profile_image,
      // Notification settings
      email_notifications,
      push_notifications,
      issue_updates,
      nearby_issues,
      weekly_digest,
      critical_alerts,
      resolution_updates,
      comment_replies,
      upvote_notifications,
      // Privacy settings
      profile_visibility,
      show_email,
      show_phone,
      show_location,
      allow_analytics,
      data_sharing,
      // System settings
      language,
      timezone,
      date_format,
      map_provider,
      auto_refresh,
      refresh_interval,
    } = body;

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    // Update user basic info if provided
    if (full_name !== undefined) {
      const { error: userError } = await supabase
        .from("users")
        .update({ name: full_name })
        .eq("id", user.userId);

      if (userError) {
        throw userError;
      }
    }

    // Build update object for user_profiles
    const profileUpdate: Record<string, unknown> = {};

    if (phone !== undefined) profileUpdate.phone = phone;
    if (address !== undefined) profileUpdate.address = address;
    if (city !== undefined) profileUpdate.city = city;
    if (state !== undefined) profileUpdate.state = state;
    if (pincode !== undefined) profileUpdate.pincode = pincode;
    if (bio !== undefined) profileUpdate.bio = bio;
    if (profile_image !== undefined)
      profileUpdate.profile_image = profile_image;

    // Notification settings
    if (email_notifications !== undefined)
      profileUpdate.email_notifications = email_notifications;
    if (push_notifications !== undefined)
      profileUpdate.push_notifications = push_notifications;
    if (issue_updates !== undefined)
      profileUpdate.issue_updates = issue_updates;
    if (nearby_issues !== undefined)
      profileUpdate.nearby_issues = nearby_issues;
    if (weekly_digest !== undefined)
      profileUpdate.weekly_digest = weekly_digest;
    if (critical_alerts !== undefined)
      profileUpdate.critical_alerts = critical_alerts;
    if (resolution_updates !== undefined)
      profileUpdate.resolution_updates = resolution_updates;
    if (comment_replies !== undefined)
      profileUpdate.comment_replies = comment_replies;
    if (upvote_notifications !== undefined)
      profileUpdate.upvote_notifications = upvote_notifications;

    // Privacy settings
    if (profile_visibility !== undefined)
      profileUpdate.profile_visibility = profile_visibility;
    if (show_email !== undefined) profileUpdate.show_email = show_email;
    if (show_phone !== undefined) profileUpdate.show_phone = show_phone;
    if (show_location !== undefined)
      profileUpdate.show_location = show_location;
    if (allow_analytics !== undefined)
      profileUpdate.allow_analytics = allow_analytics;
    if (data_sharing !== undefined) profileUpdate.data_sharing = data_sharing;

    // System settings
    if (language !== undefined) profileUpdate.language = language;
    if (timezone !== undefined) profileUpdate.timezone = timezone;
    if (date_format !== undefined) profileUpdate.date_format = date_format;
    if (map_provider !== undefined) profileUpdate.map_provider = map_provider;
    if (auto_refresh !== undefined) profileUpdate.auto_refresh = auto_refresh;
    if (refresh_interval !== undefined)
      profileUpdate.refresh_interval = refresh_interval;

    // Update or insert profile
    if (Object.keys(profileUpdate).length > 0) {
      const { error: upsertError } = await supabase
        .from("user_profiles")
        .upsert(
          {
            user_id: user.userId,
            ...profileUpdate,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          },
        );

      if (upsertError) {
        throw upsertError;
      }
    }

    // Fetch updated profile
    const { data: updatedProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select(
        `
        *,
        users!inner(name, email, avatar)
      `,
      )
      .eq("user_id", user.userId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        ...updatedProfile,
        full_name: updatedProfile.users.name,
        email: updatedProfile.users.email,
        avatar: updatedProfile.users.avatar,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/user/profile - Delete user account and all associated data
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    // Delete user (CASCADE will handle profile, votes, etc.)
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", user.userId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user account:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete account",
      },
      { status: 500 },
    );
  }
}
