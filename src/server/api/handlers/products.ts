import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;

  // POST /api/products
  if (!slug || slug.length === 0) {
    return handleCreateProduct(request);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;

  // PATCH /api/products/[id]
  if (slug && slug.length === 1) {
    return handleUpdateProduct(request, slug[0]!);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;

  // DELETE /api/products (via query param)
  if (!slug || slug.length === 0) {
    return handleDeleteProductByQuery(request);
  }

  // DELETE /api/products/[id]
  if (slug && slug.length === 1) {
    return handleDeleteProductById(request, slug[0]!);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// --- Handlers ---

async function handleCreateProduct(request: Request) {
  const session = await auth(); // Lấy session từ server

  // 1. Bảo mật: Chỉ user đã đăng nhập mới được tạo
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Lấy dữ liệu (name, desc, imageUrls) từ client
  interface CreateProductBody {
    name: string;
    description: string;
    imageUrls: string[];
  }
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

async function handleDeleteProductByQuery(request: Request) {
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

async function handleUpdateProduct(request: Request, id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

async function handleDeleteProductById(request: Request, id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
