import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth-helper";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await authenticateUser();
    const template = await prisma.template.findUnique({
      where: {
        id,
        user: {
          id: session.user.id,
        }
      },
    });

    if (!template) {
      return new NextResponse("Template Not found", { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("[TEMPLATE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await authenticateUser();
    const template = await prisma.template.findUnique({
      where: {
        id,
        user: {
          id: session.user.id,
        }
      },
    });

    if (!template) {
      return new NextResponse("Template Not found", { status: 404 });
    }

    await prisma.template.delete({
      where: {
        id,
        user: {
          id: session.user.id
        }
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TEMPLATE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
