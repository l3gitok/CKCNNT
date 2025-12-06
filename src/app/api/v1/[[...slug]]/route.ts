import { NextResponse } from "next/server";
import * as postsHandler from "~/server/api/handlers/posts";
import * as productsHandler from "~/server/api/handlers/products";
import * as rulesHandler from "~/server/api/handlers/rules";

type HandlerModule = {
  GET?: (req: Request, ctx: { params: Promise<{ slug?: string[] }> }) => Promise<Response>;
  POST?: (req: Request, ctx: { params: Promise<{ slug?: string[] }> }) => Promise<Response>;
  PUT?: (req: Request, ctx: { params: Promise<{ slug?: string[] }> }) => Promise<Response>;
  DELETE?: (req: Request, ctx: { params: Promise<{ slug?: string[] }> }) => Promise<Response>;
  PATCH?: (req: Request, ctx: { params: Promise<{ slug?: string[] }> }) => Promise<Response>;
};

const handlers: Record<string, HandlerModule> = {
  posts: postsHandler,
  products: productsHandler,
  rules: rulesHandler,
};

async function dispatch(request: Request, params: Promise<{ slug?: string[] }>, method: keyof HandlerModule) {
  const { slug } = await params;
  const [resource, ...rest] = slug ?? [];

  if (!resource || !handlers[resource]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const handler = handlers[resource]?.[method];
  if (!handler) {
    return NextResponse.json({ error: `Method ${method} not allowed` }, { status: 405 });
  }

  // Create a new params promise with the remaining slug
  const newParams = Promise.resolve({ slug: rest });
  return handler(request, { params: newParams });
}

export async function GET(request: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  return dispatch(request, params, "GET");
}

export async function POST(request: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  return dispatch(request, params, "POST");
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  return dispatch(request, params, "PUT");
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  return dispatch(request, params, "DELETE");
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  return dispatch(request, params, "PATCH");
}
