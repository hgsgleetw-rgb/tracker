import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ledgerId: string }> }
) {
  const { ledgerId } = await params;
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  try {
    const transactions = await prisma.transaction.findMany({
      where: { ledgerId, date: { gte: start, lt: end } },
      select: { amount: true, type: true, date: true },
      orderBy: { date: "asc" },
    });

    let income = 0;
    let expense = 0;
    let expenseCount = 0;
    for (const t of transactions) {
      const val = Number(t.amount);
      if (t.type === "INCOME") income += val;
      else { expense += val; expenseCount++; }
    }
    const firstDate = transactions[0]?.date ?? null;

    return NextResponse.json({
      income,
      expense,
      balance: income - expense,
      expenseCount,
      avgExpense: expenseCount > 0 ? Math.round(expense / expenseCount) : 0,
      firstDate,
    });
  } catch (e) {
    console.error("[ledger/summary]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
