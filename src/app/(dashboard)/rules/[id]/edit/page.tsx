import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { RuleForm } from "~/components/rules/RuleForm";
import type { RulePreview } from "~/lib/rules/types";

type EditRulePageProps = {
  params: {
    id: string;
  };
};

export default async function EditRulePage({ params }: EditRulePageProps): Promise<JSX.Element> {
  const { id } = params;
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="container mx-auto p-4">
        <p>Bạn cần đăng nhập để chỉnh sửa quy tắc.</p>
        <Link href="/" className="text-blue-600">
          Quay về trang chủ
        </Link>
      </main>
    );
  }

  let rule = null;
  let products: Array<{
    id: string;
    name: string;
    imageUrls: string[];
    description?: string | null;
  }> = [];

  try {
    [rule, products] = await Promise.all([
      db.autoPostRule
        .findFirst({
          where: { id, userId: session.user.id },
          include: {
            products: {
              select: { id: true },
            },
          },
        })
        .catch(() => null),
      db.product
        .findMany({
          where: { userId: session.user.id },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            imageUrls: true,
            description: true,
          },
        })
        .catch(() => []),
    ]);
  } catch (error) {
    console.error("Database connection error:", error);
  }

  if (!rule) return notFound();

  const initialData = {
    id: rule.id,
    ruleName: rule.ruleName,
    platform: rule.platform,
    scheduleTime: rule.scheduleTime,
    frequency: rule.frequency,
    promptTemplate: rule.promptTemplate,
    status: rule.status,
    productIds: rule.products?.map((product) => product.id) ?? [],
    preview: (rule.preview ?? null) as RulePreview | null,
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Chỉnh sửa Quy tắc</h1>
      <RuleForm initialData={initialData} products={products} />
    </div>
  );
}
