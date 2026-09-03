/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Metin gerekli" }, { status: 400 });
    }

    // Mock AI parsing - keyword-based extraction
    // In production, this would use OpenAI API or similar
    const lowerText = text.toLowerCase();

    // Extract floor
    let floor = "";
    const floorKeywords = [
      { keyword: "temel", value: "temel" },
      { keyword: "bodrum", value: "bodrum" },
      { keyword: "zemin", value: "zemin" },
      { keyword: "birinci kat", value: "1kat" },
      { keyword: "1. kat", value: "1kat" },
      { keyword: "ikinci kat", value: "2kat" },
      { keyword: "2. kat", value: "2kat" },
      { keyword: "üçüncü kat", value: "3kat" },
      { keyword: "3. kat", value: "3kat" },
      { keyword: "çatı", value: "catisan" },
    ];

    for (const { keyword, value } of floorKeywords) {
      if (lowerText.includes(keyword)) {
        floor = value;
        break;
      }
    }

    // Extract category
    let category = "";
    const categoryKeywords = [
      { keyword: "donatı", value: "donati" },
      { keyword: "demir", value: "donati" },
      { keyword: "beton", value: "beton" },
      { keyword: "kalıp", value: "kalip" },
      { keyword: "duvar", value: "duvar" },
      { keyword: "tesisat", value: "tesisat" },
      { keyword: "elektrik", value: "tesisat" },
      { keyword: "su", value: "tesisat" },
    ];

    for (const { keyword, value } of categoryKeywords) {
      if (lowerText.includes(keyword)) {
        category = value;
        break;
      }
    }

    // Extract priority
    let priority = "MEDIUM";
    if (lowerText.includes("acil") || lowerText.includes("kritik") || lowerText.includes("çok")) {
      priority = "CRITICAL";
    } else if (lowerText.includes("önemli")) {
      priority = "HIGH";
    }

    // Extract issue description (remove floor and category keywords)
    let issue = text;
    floorKeywords.forEach(({ keyword }) => {
      issue = issue.replace(new RegExp(keyword, "gi"), "");
    });
    categoryKeywords.forEach(({ keyword }) => {
      issue = issue.replace(new RegExp(keyword, "gi"), "");
    });
    issue = issue.trim();

    // Default values if not found
    if (!floor) floor = "zemin";
    if (!category) category = "diger";
    if (!issue) issue = text;

    const parsed = {
      floor,
      category,
      issue,
      priority,
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI parsing error:", error);
    return NextResponse.json({ error: "Ayrıştırma hatası" }, { status: 500 });
  }
}
