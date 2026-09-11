import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../utils/errors';

async function assertSellerCanSell(userId: string) {
  const application = await prisma.application.findFirst({
    where: {
      applicantId: userId,
      status: { in: ['DISBURSED', 'REPAYING', 'CLOSED'] },
    },
  });
  if (!application) {
    throw badRequest('Storefront access requires an application that is Disbursed or later');
  }
  return application;
}

export async function listProductsForPublic(_req: Request, res: Response) {
  const products = await prisma.product.findMany({
    include: {
      applicant: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });
  res.json({ success: true, data: products });
}

export async function listMyProducts(req: Request, res: Response) {
  const products = await prisma.product.findMany({
    where: { applicantId: req.auth!.userId },
    orderBy: { id: 'asc' },
  });
  res.json({ success: true, data: products });
}

export async function createProduct(req: Request, res: Response) {
  await assertSellerCanSell(req.auth!.userId);
  const { name, description, price, imageUrl } = req.body;

  const product = await prisma.product.create({
    data: {
      applicantId: req.auth!.userId,
      name,
      description,
      price,
      imageUrl: imageUrl?.trim() || null,
    },
  });

  res.status(201).json({ success: true, data: product });
}

export async function updateProduct(req: Request, res: Response) {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw notFound('Product not found');
  if (product.applicantId !== req.auth!.userId) throw forbidden('You can only edit your own products');

  const { name, description, price, imageUrl } = req.body;
  const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      name: name ?? product.name,
      description: description ?? product.description,
      price: price ?? product.price,
      imageUrl: imageUrl !== undefined ? imageUrl?.trim() || null : product.imageUrl,
    },
  });

  res.json({ success: true, data: updated });
}

export async function deleteProduct(req: Request, res: Response) {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw notFound('Product not found');
  if (product.applicantId !== req.auth!.userId) throw forbidden('You can only delete your own products');

  await prisma.product.delete({ where: { id: product.id } });
  res.json({ success: true, data: { id: product.id } });
}