import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "餐飲", icon: "🍔" },
  { name: "交通", icon: "🚌" },
  { name: "購物", icon: "🛒" },
  { name: "娛樂", icon: "🎮" },
  { name: "醫療", icon: "💊" },
  { name: "其他", icon: "💸" },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "薪資", icon: "💼" },
  { name: "獎金", icon: "🎁" },
  { name: "投資", icon: "📈" },
  { name: "其他", icon: "💰" },
];

export async function POST(request: Request) {
  try {
    const { lineUserId, displayName, pictureUrl } = await request.json();

    if (!lineUserId || !displayName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { lineUserId },
      update: { displayName, pictureUrl: pictureUrl ?? null },
      create: { lineUserId, displayName, pictureUrl: pictureUrl ?? null },
      include: { ledgers: { take: 1, orderBy: { createdAt: "asc" } } },
    });

    let ledger = user.ledgers[0];

    if (!ledger) {
      ledger = await prisma.ledger.create({
        data: {
          name: "我的帳本",
          userId: user.id,
          categories: {
            create: [
              ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, type: "EXPENSE" as const })),
              ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, type: "INCOME" as const })),
            ],
          },
        },
      });
    }

    return NextResponse.json({ userId: user.id, ledgerId: ledger.id, ledgerName: ledger.name });
  } catch (e) {
    console.error("[user/sync]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
