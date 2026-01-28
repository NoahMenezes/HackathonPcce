import { NextRequest, NextResponse } from "next/server";
import { issueDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/user/issues - Get current user's reported issues
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    // Get all user's issues
    const allUserIssues = await issueDb.findByUserId(user.userId);

    // Apply filters if provided
    let filteredIssues = allUserIssues;

    if (status) {
      filteredIssues = filteredIssues.filter(
        (issue) => issue.status === status,
      );
    }

    if (category) {
      filteredIssues = filteredIssues.filter(
        (issue) => issue.category === category,
      );
    }

    // Sort by created date (newest first)
    filteredIssues.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({
      success: true,
      data: filteredIssues,
      meta: {
        total: filteredIssues.length,
        filtered: filteredIssues.length !== allUserIssues.length,
        filters: {
          status: status || null,
          category: category || null,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user issues:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch issues",
      },
      { status: 500 },
    );
  }
}
