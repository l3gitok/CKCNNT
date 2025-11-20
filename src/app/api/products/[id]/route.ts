// src/app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

interface RouteContext {
  params: {
    id: string;
  };
}

// PATCH - Cập nhật sản phẩm
export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json() as { name?: string; description?: string; imageUrls?: string[] };

  try {
    // Kiểm tra sản phẩm có tồn tại và thuộc về user không
    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    if (product.userId !== session.user.id) {
      return NextResponse.json({ error: "Không có quyền chỉnh sửa sản phẩm này" }, { status: 403 });
    }

    // Cập nhật sản phẩm với lastPostedAt để ghi nhận thời gian cập nhật
    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        name: body.name ?? product.name,
        description: body.description ?? product.description,
        imageUrls: body.imageUrls ?? product.imageUrls,
        lastPostedAt: new Date(), // Cập nhật thời gian chỉnh sửa lần cuối
      },
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);
    return NextResponse.json({ error: "Lỗi khi cập nhật sản phẩm" }, { status: 500 });
  }
}

// DELETE - Xóa sản phẩm
export async function DELETE(request: Request, { params }: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    // Kiểm tra sản phẩm có tồn tại và thuộc về user không
    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    if (product.userId !== session.user.id) {
      return NextResponse.json({ error: "Không có quyền xóa sản phẩm này" }, { status: 403 });
    }

    // Xóa sản phẩm
    await db.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Xóa sản phẩm thành công" }, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    return NextResponse.json({ error: "Lỗi khi xóa sản phẩm" }, { status: 500 });
  }
}
