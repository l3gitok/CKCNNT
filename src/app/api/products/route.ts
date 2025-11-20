// src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { auth } from "~/server/auth"; // Import hàm auth (từ auth.js v5)
import { db } from "~/server/db";

// Type cho request body
interface CreateProductBody {
  name: string;
  description: string;
  imageUrls: string[];
}

export async function POST(request: Request) {
  const session = await auth(); // Lấy session từ server

  // 1. Bảo mật: Chỉ user đã đăng nhập mới được tạo
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Lấy dữ liệu (name, desc, imageUrls) từ client
  const body = (await request.json()) as CreateProductBody;
  const { name, description, imageUrls } = body;

  // 3. Validate (cơ bản)
  if (!name || !description || !imageUrls || imageUrls.length === 0) {
    return NextResponse.json({ error: "Thiếu trường thông tin" }, { status: 400 });
  }

  // 4. Dùng Prisma để lưu vào DB (Supabase)
  try {
    const product = await db.product.create({
      data: {
        name: name,
        description: description,
        imageUrls: imageUrls,
        userId: session.user.id, // Liên kết sản phẩm với user
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi tạo sản phẩm:", error);
    return NextResponse.json({ error: "Lỗi khi tạo sản phẩm" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  // 1. Kiểm tra đăng nhập
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Lấy product ID từ query params
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("id");

  if (!productId) {
    return NextResponse.json({ error: "Thiếu product ID" }, { status: 400 });
  }

  try {
    // 3. Kiểm tra sản phẩm có thuộc về user không
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    if (product.userId !== session.user.id) {
      return NextResponse.json({ error: "Không có quyền xóa sản phẩm này" }, { status: 403 });
    }

    // 4. Xóa sản phẩm
    await db.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: "Xóa sản phẩm thành công" }, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    return NextResponse.json({ error: "Lỗi khi xóa sản phẩm" }, { status: 500 });
  }
}
